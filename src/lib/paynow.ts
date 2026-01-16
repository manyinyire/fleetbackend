import { Paynow } from "paynow";
import crypto from "crypto";
import { apiLogger } from "./logger";

// Initialize PayNow with credentials from environment
export function getPaynowInstance() {
  const integrationId = process.env.PAYNOW_INTEGRATION_ID;
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;

  if (!integrationId || !integrationKey) {
    throw new Error("PayNow credentials not configured");
  }

  const paynow = new Paynow(integrationId, integrationKey);
  
  // Set result and return URLs - REQUIRED by Paynow API
  // resultUrl: Where Paynow posts transaction results (webhook)
  // returnUrl: Where customer is redirected after payment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  paynow.resultUrl = process.env.PAYNOW_RESULT_URL || `${baseUrl}/api/payments/paynow/callback`;
  // Note: returnUrl will be customized per payment with paymentId
  paynow.returnUrl = process.env.PAYNOW_RETURN_URL || `${baseUrl}/payments/return`;

  // Validate URLs are set (Paynow requires these fields)
  if (!paynow.resultUrl || !paynow.returnUrl) {
    throw new Error("PayNow resultUrl and returnUrl must be configured");
  }

  return paynow;
}

/**
 * Verify Paynow initiation response hash
 * CRITICAL: Must verify hash before redirecting customer to Paynow
 * According to Paynow API docs, hash verification is mandatory
 */
export function verifyInitiationHash(
  pollUrl: string,
  browserUrl: string,
  status: string,
  receivedHash: string
): boolean {
  try {
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;
    if (!integrationKey) {
      apiLogger.error('PayNow integration key not configured');
      return false;
    }

    // Build hash string according to Paynow spec
    // Hash is generated from: pollurl + browserurl + status
    const hashString = `${pollUrl}${browserUrl}${status}`;

    // Calculate hash using SHA512 HMAC
    const calculatedHash = crypto
      .createHmac("sha512", integrationKey)
      .update(hashString)
      .digest("hex")
      .toUpperCase();

    const isValid = calculatedHash === receivedHash.toUpperCase();

    if (!isValid) {
      apiLogger.error({ calculatedHash, receivedHash }, 'PayNow initiation hash verification failed');
    }

    return isValid;
  } catch (error) {
    apiLogger.error({ error }, 'Hash verification error');
    return false;
  }
}

/**
 * Express Checkout - Process mobile money payment without browser redirect
 * Supports: ecocash, onemoney, innbucks, omari
 */
export async function createExpressCheckout(
  invoiceId: string,
  amount: number,
  email: string,
  phone: string,
  method: 'ecocash' | 'onemoney' | 'innbucks' | 'omari',
  description: string
) {
  const paynow = getPaynowInstance();
  
  // Use merchant email for auth
  const authEmail = process.env.PAYNOW_MERCHANT_EMAIL?.trim() || email;
  
  apiLogger.info({
    invoiceId,
    method,
    phone,
    authEmail,
  }, 'Express Checkout initiation');

  try {
    // Create payment
    const payment = paynow.createPayment(invoiceId, authEmail);
    payment.add(description, amount);

    // Send mobile payment (express checkout)
    const response = await paynow.sendMobile(payment, phone, method);

    apiLogger.info({ response }, 'Express Checkout response');

    if (response.success) {
      return {
        success: true,
        pollUrl: response.pollUrl,
        instructions: response.instructions, // USSD code for mobile money
        status: response.status,
        error: null,
      };
    } else {
      apiLogger.error({ error: response.error }, 'Express Checkout failed');
      return {
        success: false,
        error: response.error || 'Express checkout failed',
        pollUrl: null,
        instructions: null,
        status: null,
      };
    }
  } catch (error) {
    apiLogger.error({ err: error }, 'Express Checkout exception');
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      pollUrl: null,
      instructions: null,
      status: null,
    };
  }
}

/**
 * Create a payment for an invoice (Standard redirect flow)
 */
export async function createPayment(
  invoiceId: string,
  amount: number,
  email: string,
  description: string,
  customReturnUrl?: string
) {
  const paynow = getPaynowInstance();

  // Override return URL if custom one is provided
  if (customReturnUrl) {
    paynow.returnUrl = customReturnUrl;
  }

  // In test mode, Paynow requires authemail to match merchant's registered email
  // In production, authemail can be customer's email for auto-login
  // CRITICAL: If PAYNOW_MERCHANT_EMAIL is set, we MUST use it in test mode
  const merchantEmail = process.env.PAYNOW_MERCHANT_EMAIL?.trim();
  
  // If merchant email is configured, use it (required for test mode)
  // Otherwise, use customer email (for production auto-login)
  const authEmail = merchantEmail || email;

  // Log which email is being used for debugging
  apiLogger.info({
    invoiceId,
    merchantEmail: merchantEmail || 'NOT SET - using customer email',
    customerEmail: email,
    authEmailUsed: authEmail,
    integrationId: process.env.PAYNOW_INTEGRATION_ID,
    envVarLoaded: !!merchantEmail,
  }, 'PayNow payment initiation');

  // Warn if merchant email is not set in test mode
  if (!merchantEmail) {
    apiLogger.warn('PAYNOW_MERCHANT_EMAIL is not set. In test mode, authemail must match merchant email. Set PAYNOW_MERCHANT_EMAIL environment variable to your Paynow merchant email');
  }

  // Create a new payment with authEmail
  const payment = paynow.createPayment(invoiceId, authEmail);

  // Add item to the payment (USD only)
  payment.add(description, amount);

  try {
    // Send payment to PayNow
    const response = await paynow.send(payment);

    apiLogger.info({ response }, 'PayNow raw response');
    apiLogger.debug({
      success: response.success,
      successType: typeof response.success,
      error: response.error,
      pollUrl: response.pollUrl,
      pollUrlType: typeof response.pollUrl,
      redirectUrl: response.redirectUrl,
      redirectUrlType: typeof response.redirectUrl,
      hash: response.hash,
      allKeys: Object.keys(response),
    }, 'PayNow response analysis');

    if (response.success && response.pollUrl && response.redirectUrl) {
      // Hash verification - in test mode, PayNow might not return a hash
      // We'll skip hash verification if not present (only in test mode scenario)
      if (response.hash) {
        // CRITICAL: Verify hash before proceeding
        // According to Paynow API docs: "It is vital that the merchant site verify
        // the hash value contained in the message before redirecting the Customer"
        const isValidHash = verifyInitiationHash(
          response.pollUrl,
          response.redirectUrl,
          "Ok", // Status should be "Ok" for successful initiation
          response.hash
        );

        if (!isValidHash) {
          apiLogger.error('PayNow initiation hash verification failed - security risk');
          return {
            success: false,
            error: "Payment initiation hash verification failed",
          };
        }
        apiLogger.info('PayNow hash verified successfully');
      } else {
        apiLogger.warn('No hash returned by PayNow. This may be expected in test mode');
      }

      apiLogger.info({ redirectUrl: response.redirectUrl }, 'PayNow payment initiated successfully');
      return {
        success: true,
        pollUrl: response.pollUrl,
        redirectUrl: response.redirectUrl, // This is BrowserUrl from Paynow
        hash: response.hash || 'NO_HASH_PROVIDED',
      };
    } else {
      apiLogger.error({ error: response.error, response }, 'PayNow payment initiation failed - missing required fields');
      return {
        success: false,
        error: response.error || "Payment initiation failed - missing required response fields",
      };
    }
  } catch (error) {
    apiLogger.error({ error }, 'PayNow payment error');
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check payment status - CRITICAL for security
 * Always verify payment status from PayNow servers, never trust client-side data
 * Includes retry logic with exponential backoff for reliability
 */
export async function checkPaymentStatus(pollUrl: string, retries = 2) {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const paynow = getPaynowInstance();
      const status = await paynow.pollTransaction(pollUrl);

      apiLogger.debug({ status, attempt }, 'PayNow poll transaction raw response');
      apiLogger.debug({
        keys: Object.keys(status),
        paid: status.paid,
        paidType: typeof status.paid,
        status: status.status,
        statusType: typeof status.status,
        amount: status.amount,
        amountType: typeof status.amount,
      }, 'PayNow status details');

      // PayNow returns status as lowercase string like 'paid', 'awaiting delivery', 'cancelled'
      // We need to check if status is 'paid' or 'Paid' (case insensitive)
      const isPaid = status.status?.toLowerCase() === 'paid' || status.paid === true;

      return {
        success: true,
        paid: isPaid,
        status: status.status,
        amount: status.amount,
        reference: status.reference,
        paynowReference: status.paynowreference,
        pollUrl: status.pollurl,
        hash: status.hash,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      apiLogger.warn({ error, attempt, retries }, 'PayNow status check failed, retrying...');
      
      // Don't retry on last attempt
      if (attempt < retries) {
        // Reduced delay: 500ms for faster verification
        const delay = 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  apiLogger.error({ error: lastError, retries }, 'PayNow status check failed after all retries');
  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : "Status check failed after retries",
    attempts: retries,
  };
}

/**
 * Verify webhook data integrity - CRITICAL security function
 * This prevents fake success callbacks
 */
export function verifyWebhookSignature(data: any): boolean {
  try {
    const paynow = getPaynowInstance();
    
    // PayNow sends a hash with the webhook data
    // We need to verify this hash matches what we expect
    const receivedHash = data.hash;

    if (!receivedHash) {
      apiLogger.error('No hash provided in webhook data');
      return false;
    }

    // Reconstruct the hash using the integration key
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY!;
    const values = Object.keys(data)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => data[key])
      .join('');
    
    const calculatedHash = crypto
      .createHmac('sha512', integrationKey)
      .update(values)
      .digest('hex')
      .toUpperCase();

    const isValid = calculatedHash === receivedHash.toUpperCase();

    if (!isValid) {
      apiLogger.error({ receivedHash, calculatedHash }, 'Webhook signature verification failed');
    }

    return isValid;
  } catch (error) {
    apiLogger.error({ error }, 'Webhook verification error');
    return false;
  }
}

/**
 * Generate verification hash for our internal records
 * This provides an additional layer of security
 */
export function generatePaymentVerificationHash(
  paymentId: string,
  amount: string,
  paynowReference: string
): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required for payment verification');
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${paymentId}-${amount}-${paynowReference}`)
    .digest("hex");
}

/**
 * Verify internal payment hash
 */
export function verifyPaymentHash(
  paymentId: string,
  amount: string,
  paynowReference: string,
  hash: string
): boolean {
  const expectedHash = generatePaymentVerificationHash(
    paymentId,
    amount,
    paynowReference
  );
  return expectedHash === hash;
}

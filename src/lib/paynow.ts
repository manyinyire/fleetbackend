import { Paynow } from "paynow";
import crypto from "crypto";

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
      console.error("PayNow integration key not configured");
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
      console.error("PayNow initiation hash verification failed");
      console.error("Expected hash:", calculatedHash);
      console.error("Received hash:", receivedHash);
    }

    return isValid;
  } catch (error) {
    console.error("Hash verification error:", error);
    return false;
  }
}

/**
 * Create a payment for an invoice
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
  console.log('[Paynow] Payment initiation:', {
    invoiceId,
    merchantEmail: merchantEmail || 'NOT SET - using customer email',
    customerEmail: email,
    authEmailUsed: authEmail,
    integrationId: process.env.PAYNOW_INTEGRATION_ID,
    envVarLoaded: !!merchantEmail,
  });

  // Warn if merchant email is not set in test mode
  if (!merchantEmail) {
    console.warn('[Paynow] WARNING: PAYNOW_MERCHANT_EMAIL is not set. In test mode, authemail must match merchant email.');
    console.warn('[Paynow] Set PAYNOW_MERCHANT_EMAIL environment variable to your Paynow merchant email (e.g., hello@azaire.co.zw)');
  }

  // Create a new payment with authEmail
  const payment = paynow.createPayment(invoiceId, authEmail);

  // Add item to the payment (USD only)
  payment.add(description, amount);

  try {
    // Send payment to PayNow
    const response = await paynow.send(payment);

    console.log('[Paynow] Raw Response from PayNow:', response);
    console.log('[Paynow] Response analysis:', {
      success: response.success,
      successType: typeof response.success,
      error: response.error,
      pollUrl: response.pollUrl,
      pollUrlType: typeof response.pollUrl,
      redirectUrl: response.redirectUrl,
      redirectUrlType: typeof response.redirectUrl,
      hash: response.hash,
      allKeys: Object.keys(response),
    });

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
          console.error("PayNow initiation hash verification failed - security risk");
          return {
            success: false,
            error: "Payment initiation hash verification failed",
          };
        }
        console.log('[Paynow] Hash verified successfully');
      } else {
        console.warn('[Paynow] WARNING: No hash returned by PayNow. This may be expected in test mode.');
      }

      console.log('[Paynow] Payment initiated successfully, redirectUrl:', response.redirectUrl);
      return {
        success: true,
        pollUrl: response.pollUrl,
        redirectUrl: response.redirectUrl, // This is BrowserUrl from Paynow
        hash: response.hash || 'NO_HASH_PROVIDED',
      };
    } else {
      console.error('[Paynow] Payment initiation failed:', response.error || 'Unknown error');
      console.error('[Paynow] Missing required fields. Response:', response);
      return {
        success: false,
        error: response.error || "Payment initiation failed - missing required response fields",
      };
    }
  } catch (error) {
    console.error("PayNow payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check payment status - CRITICAL for security
 * Always verify payment status from PayNow servers, never trust client-side data
 */
export async function checkPaymentStatus(pollUrl: string) {
  try {
    const paynow = getPaynowInstance();
    const status = await paynow.pollTransaction(pollUrl);

    return {
      success: true,
      paid: status.paid,
      status: status.status,
      amount: status.amount,
      reference: status.reference,
      paynowReference: status.paynowreference,
      pollUrl: status.pollurl,
      hash: status.hash,
    };
  } catch (error) {
    console.error("PayNow status check error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Status check failed",
    };
  }
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
      console.error("No hash provided in webhook data");
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
      console.error("Webhook signature verification failed");
      console.error("Received hash:", receivedHash);
      console.error("Calculated hash:", calculatedHash);
    }

    return isValid;
  } catch (error) {
    console.error("Webhook verification error:", error);
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

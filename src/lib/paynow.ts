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
  
  // Set result and return URLs
  paynow.resultUrl = process.env.PAYNOW_RESULT_URL || "";
  paynow.returnUrl = process.env.PAYNOW_RETURN_URL || "";

  return paynow;
}

/**
 * Create a payment for an invoice
 */
export async function createPayment(
  invoiceId: string,
  amount: number,
  email: string,
  description: string
) {
  const paynow = getPaynowInstance();

  // Create a new payment
  const payment = paynow.createPayment(invoiceId, email);

  // Add item to the payment (USD only)
  payment.add(description, amount);

  try {
    // Send payment to PayNow
    const response = await paynow.send(payment);

    if (response.success) {
      return {
        success: true,
        pollUrl: response.pollUrl,
        redirectUrl: response.redirectUrl,
        hash: response.hash,
      };
    } else {
      return {
        success: false,
        error: response.error || "Payment initiation failed",
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
  const secret = process.env.BETTER_AUTH_SECRET || "fallback-secret";
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

import { NextRequest, NextResponse } from "next/server";
import { withTenantAuth, successResponse, validateBody } from "@/lib/api-middleware";
import { createPayment } from "@/lib/paynow";
import { paymentInitiateSchema } from "@/lib/validations";
import { Errors, handleCommonError } from "@/lib/error-handler";
import { PrismaClient } from "@prisma/client";

interface PaymentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Shared payment initiation logic
async function initiatePayment(
  prisma: PrismaClient,
  tenantId: string,
  user: PaymentUser,
  invoiceId: string,
  request: NextRequest
) {
  // Fetch invoice with tenant relationship
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: tenantId, // Ensure invoice belongs to tenant
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payments: {
        where: {
          status: "PENDING",
        },
      },
    },
  });

  // Verify invoice exists
  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  // Verify user has access to this invoice (super admin can access any)
  if (user.role !== "SUPER_ADMIN" && invoice.tenantId !== tenantId) {
    throw new Error("Unauthorized to pay this invoice");
  }

  // Check if invoice is already paid
  if (invoice.status === "PAID") {
    throw Errors.invalidState("Invoice is already paid");
  }

  // Check for existing pending payments
  if (invoice.payments.length > 0) {
    // Check if payment is stale (more than 30 minutes old)
    const pendingPayment = invoice.payments[0];
    
    if (pendingPayment) {
      const paymentAge = Date.now() - new Date(pendingPayment.createdAt).getTime();
      const STALE_PAYMENT_THRESHOLD = 30 * 60 * 1000; // 30 minutes

      if (paymentAge > STALE_PAYMENT_THRESHOLD) {
        // Cancel stale payment
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: "CANCELLED",
            paymentMetadata: {
              ...(typeof pendingPayment.paymentMetadata === 'object' && pendingPayment.paymentMetadata !== null ? pendingPayment.paymentMetadata : {}),
              cancelledReason: "Stale payment (timeout)",
              cancelledAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // Payment is still fresh, reject new payment attempt
        throw Errors.paymentPending(invoice.invoiceNumber);
      }
    }
  }

  // First, create a payment record to get the payment ID
  const tempPayment = await prisma.payment.create({
    data: {
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency || "USD",
      paymentMethod: "paynow",
      status: "PENDING",
      verified: false,
      paymentMetadata: {
        initiatedBy: user.id,
      },
    },
  });

  // Create payment in PayNow with custom return URL including payment and invoice IDs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const customReturnUrl = `${baseUrl}/payments/success?paymentId=${tempPayment.id}&invoiceId=${invoice.id}`;

  // Note: In test mode, Paynow requires authemail to match merchant's registered email
  // Set PAYNOW_MERCHANT_EMAIL environment variable to your Paynow merchant email for test mode
  const paynowResponse = await createPayment(
    invoice.invoiceNumber,
    Number(invoice.amount),
    invoice.tenant.email, // Customer email (used in production, overridden by merchant email in test mode)
    invoice.description || `Invoice ${invoice.invoiceNumber}`,
    customReturnUrl
  );

  if (!paynowResponse.success) {
    // Delete the temp payment if PayNow initiation failed
    await prisma.payment.delete({ where: { id: tempPayment.id } });
    throw new Error(paynowResponse.error || "Payment initiation failed");
  }

  // Update payment record with PayNow response data
  const payment = await prisma.payment.update({
    where: { id: tempPayment.id },
    data: {
      pollUrl: paynowResponse.pollUrl,
      redirectUrl: paynowResponse.redirectUrl,
      paymentMetadata: {
        hash: paynowResponse.hash,
        initiatedBy: user.id,
      },
    },
  });

  // Log the payment initiation
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: invoice.tenantId,
      action: "PAYMENT_INITIATED",
      entityType: "Payment",
      entityId: payment.id,
      newValues: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount.toString(),
        gateway: "PAYNOW",
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  });

  return {
    paymentId: payment.id,
    redirectUrl: paynowResponse.redirectUrl,
    pollUrl: paynowResponse.pollUrl,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount.toString(),
    currency: invoice.currency || "USD",
  };
}

export const POST = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  // Validate request body
  const data = await validateBody(request, paymentInitiateSchema);
  const { invoiceId } = data;

  // Initiate payment
  const result = await initiatePayment(prisma, tenantId, user, invoiceId, request);

  return successResponse({
    success: true,
    paymentId: result.paymentId,
    redirectUrl: result.redirectUrl,
    pollUrl: result.pollUrl,
    analytics: {
      invoiceNumber: result.invoiceNumber,
      amount: result.amount,
      currency: result.currency,
      gaTracked: true, // Client-side will track
    },
  });
});

// GET handler for backward compatibility (redirects to Paynow)
export const GET = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoiceId");

  if (!invoiceId) {
    return successResponse({ error: "invoiceId is required" }, 400);
  }

  try {
    // Initiate payment
    const result = await initiatePayment(prisma, tenantId, user, invoiceId, request);

    // Redirect to Paynow payment page
    if (!result.redirectUrl) {
      return successResponse({ error: "Payment redirect URL not available" }, 500);
    }
    return NextResponse.redirect(result.redirectUrl);
  } catch (error) {
    // If error, return error response instead of redirecting
    return successResponse(
      { error: error instanceof Error ? error.message : "Payment initiation failed" },
      500
    );
  }
});

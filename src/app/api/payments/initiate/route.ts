import { NextRequest, NextResponse } from "next/server";
import { withTenantAuth, successResponse, validateBody } from "@/lib/api-middleware";
import { createPayment } from "@/lib/paynow";
import { paymentInitiateSchema } from "@/lib/validations";

// Shared payment initiation logic
async function initiatePayment(
  prisma: any,
  tenantId: string,
  user: any,
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
    throw new Error("Invoice is already paid");
  }

  // Check if there's already a pending payment for this invoice
  if (invoice.payments.length > 0) {
    throw new Error("There is already a pending payment for this invoice");
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
    return NextResponse.redirect(result.redirectUrl);
  } catch (error) {
    // If error, return error response instead of redirecting
    return successResponse(
      { error: error instanceof Error ? error.message : "Payment initiation failed" },
      500
    );
  }
});

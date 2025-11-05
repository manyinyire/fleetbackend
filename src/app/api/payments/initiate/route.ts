import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPayment, generatePaymentVerificationHash } from "@/lib/paynow";
import { auth } from "@/lib/auth-server";
import { paymentInitiateSchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";

// Validation schema for payment initiation
const initiatePaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
});

export const POST = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  const data = await validateBody(request, initiatePaymentSchema);

    const body = await request.json();

    // Validate input
    const { invoiceId } = paymentInitiateSchema.parse(body);

    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true },
    });

  // Verify user has access to this invoice
  if (user.role !== 'SUPER_ADMIN' && tenantId !== invoice.tenantId) {
    return successResponse({ error: 'Unauthorized to pay this invoice' }, 403);
  }

  // Check if invoice is already paid
  if (invoice.status === 'PAID') {
    return successResponse({ error: 'Invoice is already paid' }, 400);
  }

  // Create payment in PayNow
  const paynowResponse = await createPayment(
    invoice.invoiceNumber,
    Number(invoice.amount),
    invoice.tenant.email,
    invoice.description || `Invoice ${invoice.invoiceNumber}`
  );

  if (!paynowResponse.success) {
    return successResponse(
      { error: paynowResponse.error || 'Payment initiation failed' },
      500
    );
  }

    if (!paynowResponse.success) {
      return NextResponse.json(
        { error: paynowResponse.error || "Payment initiation failed" },
        { status: 500 }
      );
    }

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        paymentMethod: "paynow",
        pollUrl: paynowResponse.pollUrl,
        redirectUrl: paynowResponse.redirectUrl,
        status: "PENDING",
        verified: false,
        paymentMetadata: {
          hash: paynowResponse.hash,
          initiatedBy: session.user.id
        }
      }
    });

    // Log the payment initiation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        tenantId: invoice.tenantId,
        action: "PAYMENT_INITIATED",
        entityType: "Payment",
        entityId: payment.id,
        details: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount.toString(),
          paymentId: payment.id,
          gateway: "PAYNOW",
          gaTracked: true,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: paynowResponse.redirectUrl,
      pollUrl: paynowResponse.pollUrl,
      analytics: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount.toString(),
        gaTracked: true, // Client-side will track
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

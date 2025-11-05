import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPayment } from "@/lib/paynow";
import { auth } from "@/lib/auth-server";
import { withErrorHandler } from "@/lib/api";
import { initiatePaymentSchema } from "@/lib/validations/payment";
import { logger } from "@/lib/logger";

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Authenticate user
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const validatedData = initiatePaymentSchema.parse(body);

  // Get invoice details
  const invoice = await prisma.invoice.findUnique({
    where: { id: validatedData.invoiceId },
    include: {
      tenant: true,
      payments: {
        where: {
          status: { in: ['PENDING', 'PROCESSING'] }
        }
      }
    },
  });

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  // Verify user has access to this invoice
  if (session.user.role !== "SUPER_ADMIN" && session.user.tenantId !== invoice.tenantId) {
    return NextResponse.json(
      { error: "Unauthorized to pay this invoice" },
      { status: 403 }
    );
  }

  // Check if invoice is already paid
  if (invoice.status === "PAID") {
    return NextResponse.json(
      { error: "Invoice is already paid" },
      { status: 400 }
    );
  }

  // Check if there's already a pending payment for this invoice
  if (invoice.payments.length > 0) {
    return NextResponse.json(
      { error: "There is already a pending payment for this invoice" },
      { status: 400 }
    );
  }

  // Create payment in PayNow
  const paynowResponse = await createPayment(
    invoice.invoiceNumber,
    Number(validatedData.amount),
    validatedData.email || invoice.tenant.email,
    invoice.description || `Invoice ${invoice.invoiceNumber}`
  );

  if (!paynowResponse.success) {
    logger.error({
      invoiceId: invoice.id,
      error: paynowResponse.error
    }, 'PayNow payment initiation failed');

    return NextResponse.json(
      { error: paynowResponse.error || "Payment initiation failed" },
      { status: 500 }
    );
  }

  // Create payment record in database
  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      amount: validatedData.amount,
      currency: invoice.currency,
      paymentMethod: validatedData.paymentMethod,
      paymentProvider: 'paynow',
      pollUrl: paynowResponse.pollUrl,
      status: 'PENDING',
      metadata: {
        hash: paynowResponse.hash,
        redirectUrl: paynowResponse.redirectUrl,
        phone: validatedData.phone,
        email: validatedData.email,
      },
    },
  });

  // Log the payment initiation
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      tenantId: invoice.tenantId,
      action: "PAYMENT_INITIATED",
      entityType: "Payment",
      entityId: payment.id,
      newValues: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: validatedData.amount.toString(),
        method: validatedData.paymentMethod,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  });

  logger.info({
    paymentId: payment.id,
    invoiceId: invoice.id,
    amount: validatedData.amount,
    method: validatedData.paymentMethod,
  }, 'Payment initiated');

  return NextResponse.json({
    success: true,
    paymentId: payment.id,
    redirectUrl: paynowResponse.redirectUrl,
    pollUrl: paynowResponse.pollUrl,
    analytics: {
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(validatedData.amount),
      currency: invoice.currency,
    },
  });
}, 'payments-initiate:POST');

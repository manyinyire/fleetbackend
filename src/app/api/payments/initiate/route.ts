import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, validateBody } from '@/lib/api-middleware';
import { createPayment } from '@/lib/paynow';
import { z } from 'zod';

// Validation schema for payment initiation
const initiatePaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
});

export const POST = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  const data = await validateBody(request, initiatePaymentSchema);

  // Get invoice details
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { tenant: true },
  });

  if (!invoice) {
    return successResponse({ error: 'Invoice not found' }, 404);
  }

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

  // TODO: Create Payment model in schema
  // Once Payment model exists, create payment record:
  // const payment = await prisma.payment.create({
  //   data: {
  //     tenantId: invoice.tenantId,
  //     invoiceId: invoice.id,
  //     amount: invoice.amount,
  //     currency: invoice.currency,
  //     gateway: "PAYNOW",
  //     pollUrl: paynowResponse.pollUrl,
  //     status: "PENDING",
  //     verified: false,
  //     paymentMetadata: {
  //       hash: paynowResponse.hash,
  //       redirectUrl: paynowResponse.redirectUrl,
  //     },
  //   },
  // });

  // Log the payment initiation
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: invoice.tenantId,
      action: 'PAYMENT_INITIATED',
      entityType: 'Payment',
      entityId: invoice.id, // Using invoice ID temporarily until Payment model exists
      details: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount.toString(),
        gaTracked: true, // Client-side will track
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    },
  });

  return successResponse({
    success: true,
    paymentId: invoice.id, // Using invoice ID temporarily until Payment model exists
    redirectUrl: paynowResponse.redirectUrl,
    pollUrl: paynowResponse.pollUrl,
    // Return tracking info for client-side analytics
    analytics: {
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      currency: invoice.currency,
    },
  });
});

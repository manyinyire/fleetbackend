import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, validateBody } from '@/lib/api-middleware';
import { createExpressCheckout } from '@/lib/paynow';
import { z } from 'zod';
import { apiLogger } from '@/lib/logger';

const expressCheckoutSchema = z.object({
  invoiceId: z.string().cuid(),
  phone: z.string().regex(/^(?:\+263|0)[0-9]{9}$/, 'Invalid Zimbabwe phone number'),
  method: z.enum(['ecocash', 'onemoney', 'innbucks', 'omari']),
});

/**
 * Express Checkout - Process mobile money payment without browser redirect
 */
export const POST = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  const data = await validateBody(request, expressCheckoutSchema);
  const { invoiceId, phone, method } = data;

  // Get invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: true,
    },
  });

  if (!invoice) {
    return successResponse({ error: 'Invoice not found' }, 404);
  }

  // Verify tenant access
  if (invoice.tenantId !== tenantId && user.role !== 'SUPER_ADMIN') {
    return successResponse({ error: 'Unauthorized' }, 403);
  }

  // Check if invoice is already paid
  if (invoice.status === 'PAID') {
    return successResponse({ error: 'Invoice already paid' }, 400);
  }

  // Check for existing pending payment
  const existingPayment = await prisma.payment.findFirst({
    where: {
      invoiceId: invoice.id,
      status: 'PENDING',
      createdAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
      },
    },
  });

  if (existingPayment && existingPayment.pollUrl) {
    apiLogger.info({ paymentId: existingPayment.id }, 'Reusing existing payment');
    
    // Return existing payment details only if it has a pollUrl
    return successResponse({
      success: true,
      payment: {
        id: existingPayment.id,
        pollUrl: existingPayment.pollUrl,
        status: existingPayment.status,
      },
      message: 'Payment already initiated. Please complete the payment.',
    });
  }
  
  // If existing payment has no pollUrl, delete it and create a new one
  if (existingPayment) {
    await prisma.payment.delete({ where: { id: existingPayment.id } });
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency || 'USD',
      status: 'PENDING',
      paymentMethod: 'PAYNOW',
      paymentMetadata: {
        expressCheckout: true,
        mobileMethod: method,
        phone: phone,
      },
    },
  });

  apiLogger.info({ paymentId: payment.id, method, phone }, 'Initiating express checkout');

  // Initiate express checkout with PayNow
  const description = `Invoice ${invoice.invoiceNumber}`;
  const paynowResponse = await createExpressCheckout(
    invoice.invoiceNumber,
    Number(invoice.amount),
    invoice.tenant.email,
    phone,
    method,
    description
  );

  if (!paynowResponse.success) {
    // Update payment status to failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        paymentMetadata: {
          ...payment.paymentMetadata,
          error: paynowResponse.error,
        },
      },
    });

    return successResponse({
      success: false,
      error: paynowResponse.error || 'Failed to initiate express checkout',
    }, 400);
  }

  // Update payment with poll URL and instructions
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      pollUrl: paynowResponse.pollUrl,
      paymentMetadata: {
        ...(payment.paymentMetadata as object || {}),
        expressCheckout: true,
        mobileMethod: method,
        phone: phone,
        instructions: paynowResponse.instructions,
        paynowStatus: paynowResponse.status,
      },
    },
  });

  apiLogger.info({ paymentId: payment.id, pollUrl: paynowResponse.pollUrl }, 'Express checkout initiated');

  return successResponse({
    success: true,
    payment: {
      id: updatedPayment.id,
      pollUrl: paynowResponse.pollUrl,
      instructions: paynowResponse.instructions,
      status: updatedPayment.status,
    },
    message: method === 'ecocash' || method === 'onemoney' 
      ? `Please dial ${paynowResponse.instructions} on your phone to complete payment`
      : 'Payment initiated. Please follow the instructions to complete payment.',
  });
});

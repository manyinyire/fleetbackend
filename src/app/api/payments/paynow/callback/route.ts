import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkPaymentStatus,
  verifyWebhookSignature,
} from "@/lib/paynow";
import {
  sendPaymentConfirmationEmail,
  sendAdminPaymentAlert,
} from "@/lib/email";
import { withErrorHandler } from "@/lib/api";
import { paynowCallbackSchema } from "@/lib/validations/payment";
import { logger } from "@/lib/logger";

/**
 * PayNow Callback Handler
 * CRITICAL: This endpoint handles payment confirmation from PayNow
 * Security is paramount - we MUST verify every payment before taking action
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Validate webhook payload
  const validatedData = paynowCallbackSchema.parse(body);

  logger.info({
    reference: validatedData.reference,
    paynowReference: validatedData.paynowreference,
    status: validatedData.status,
  }, "PayNow callback received");

  // SECURITY CHECK 1: Verify webhook signature
  const isValidSignature = verifyWebhookSignature(body);
  if (!isValidSignature) {
    logger.error({ reference: validatedData.reference }, "Invalid webhook signature - possible fraud attempt");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 403 }
    );
  }

  const { reference, paynowreference: paynowReference, amount, status } = validatedData;

  // Find the invoice and payment record
  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: reference },
    include: {
      tenant: {
        include: {
          users: {
            take: 1,
            orderBy: { createdAt: 'asc' }
          }
        }
      },
      payments: {
        where: {
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
  });

  if (!invoice) {
    logger.error({ reference }, "Invoice not found");
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  // Get the payment record
  const payment = invoice.payments[0];

  if (!payment) {
    logger.error({
      invoiceId: invoice.id,
      reference
    }, "Payment record not found for invoice");
    return NextResponse.json(
      { error: "Payment record not found" },
      { status: 404 }
    );
  }

  // SECURITY CHECK 2: Double-check payment status with PayNow servers
  // NEVER trust webhook data alone - always verify with the payment gateway
  if (!payment.pollUrl) {
    logger.error({ paymentId: payment.id }, "No poll URL for payment verification");
    return NextResponse.json(
      { error: "Cannot verify payment - no poll URL" },
      { status: 400 }
    );
  }

  // Verify payment status with PayNow
  const statusCheck = await checkPaymentStatus(payment.pollUrl);

  if (!statusCheck.success) {
    logger.error({
      paymentId: payment.id,
      error: statusCheck.error
    }, "Failed to verify payment with PayNow");

    // Update payment as failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: 'Verification with PayNow failed',
      }
    });

    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }

  // Compare webhook data with verified data
  if (!statusCheck.paid) {
    logger.warn({
      paymentId: payment.id,
      webhookStatus: status,
      verifiedStatus: statusCheck.status
    }, "Payment not confirmed as paid by PayNow");

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'Cancelled' ? 'CANCELLED' : 'FAILED',
        providerReference: paynowReference,
        failedAt: new Date(),
        failureReason: `Payment ${status.toLowerCase()} - not confirmed by PayNow`,
      }
    });

    return NextResponse.json({
      success: false,
      message: "Payment not completed"
    });
  }

  // Verify amount matches
  const expectedAmount = Number(payment.amount);
  const receivedAmount = Number(statusCheck.amount);

  if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
    logger.error({
      paymentId: payment.id,
      expected: expectedAmount,
      received: receivedAmount
    }, "Payment amount mismatch");

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: `Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`,
      }
    });

    return NextResponse.json(
      { error: "Payment amount mismatch" },
      { status: 400 }
    );
  }

  // Payment verified successfully - update records
  const now = new Date();

  await prisma.$transaction([
    // Update payment record
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        providerReference: paynowReference,
        paidAt: now,
        verifiedAt: now,
      }
    }),

    // Update invoice status
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        paidAt: now,
      }
    }),

    // Log to audit trail
    prisma.auditLog.create({
      data: {
        userId: invoice.tenant.users[0]?.id || 'system',
        tenantId: invoice.tenantId,
        action: 'PAYMENT_COMPLETED',
        entityType: 'Payment',
        entityId: payment.id,
        newValues: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: payment.amount.toString(),
          paynowReference,
          verifiedAt: now.toISOString(),
        },
        ipAddress: request.headers.get("x-forwarded-for") || "webhook",
        userAgent: request.headers.get("user-agent") || "paynow-webhook",
      }
    })
  ]);

  logger.info({
    paymentId: payment.id,
    invoiceId: invoice.id,
    amount: payment.amount,
    paynowReference,
  }, 'Payment completed and verified');

  // Handle post-payment actions based on invoice type
  try {
    if (invoice.type === 'UPGRADE') {
      // Upgrade tenant plan
      const newPlan = invoice.plan;
      await prisma.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          plan: newPlan,
          subscriptionStartDate: now,
          subscriptionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });

      logger.info({
        tenantId: invoice.tenantId,
        newPlan
      }, 'Tenant plan upgraded');
    }

    if (invoice.type === 'SUBSCRIPTION' && invoice.tenant.status === 'SUSPENDED') {
      // Unsuspend tenant
      await prisma.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
        }
      });

      logger.info({
        tenantId: invoice.tenantId
      }, 'Suspended tenant reactivated');
    }

    // Send confirmation emails
    await Promise.allSettled([
      sendPaymentConfirmationEmail(
        invoice.tenant.users[0]?.email || invoice.tenant.email,
        {
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(payment.amount),
          currency: invoice.currency,
          paidAt: now,
        }
      ),
      sendAdminPaymentAlert({
        tenantName: invoice.tenant.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(payment.amount),
        currency: invoice.currency,
      })
    ]);

    logger.info({ paymentId: payment.id }, 'Payment confirmation emails sent');
  } catch (error) {
    // Log but don't fail the payment if post-processing fails
    logger.error({
      err: error,
      paymentId: payment.id
    }, 'Post-payment processing error');
  }

  return NextResponse.json({
    success: true,
    message: "Payment processed successfully",
    paymentId: payment.id,
  });
}, 'paynow-callback:POST');

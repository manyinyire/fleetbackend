import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import {
  checkPaymentStatus,
  verifyWebhookSignature,
  generatePaymentVerificationHash,
} from '@/lib/paynow';
import {
  sendPaymentConfirmationEmail,
  sendAdminPaymentAlert,
  generateInvoicePdf,
} from '@/lib/email';
import { apiLogger } from '@/lib/logger';

// Webhook-specific rate limiting (100 requests per minute per IP)
const webhookRateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkWebhookRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = 100;
  const window = 60 * 1000; // 1 minute

  const record = webhookRateLimiter.get(identifier);

  if (!record || record.resetTime < now) {
    webhookRateLimiter.set(identifier, { count: 1, resetTime: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Replay attack protection (track processed webhooks for 1 hour)
const processedWebhooks = new Map<string, number>();

function isReplayAttack(reference: string, timestamp: number): boolean {
  const processed = processedWebhooks.get(reference);

  if (processed && timestamp <= processed) {
    return true;
  }

  // Clean up old entries (older than 1 hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, time] of processedWebhooks.entries()) {
    if (time < oneHourAgo) {
      processedWebhooks.delete(key);
    }
  }

  return false;
}

/**
 * PayNow Callback Handler
 * CRITICAL: This endpoint handles payment confirmation from PayNow
 * Security is paramount - we MUST verify every payment before taking action
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();

  // SECURITY: Get client IP for rate limiting and logging
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  // SECURITY: Webhook-specific rate limiting
  if (!checkWebhookRateLimit(clientIp)) {
    apiLogger.error({ clientIp }, 'Webhook rate limit exceeded');
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json();

  apiLogger.info(
    {
      reference: body.reference,
      paynowreference: body.paynowreference,
      status: body.status,
      clientIp,
    },
    'PayNow callback received'
  );

  // SECURITY CHECK 1: Verify webhook signature
  const isValidSignature = verifyWebhookSignature(body);
  if (!isValidSignature) {
    apiLogger.error({ clientIp, body }, 'Invalid webhook signature - possible fraud attempt');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const { reference, paynowreference: paynowReference, amount, status } = body;

  // SECURITY CHECK 2: Replay attack protection
  if (isReplayAttack(reference, startTime)) {
    apiLogger.error({ reference, clientIp }, 'Replay attack detected');
    return NextResponse.json({ error: 'Duplicate webhook' }, { status: 409 });
  }

  // Find the invoice and associated payment
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
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
  });

  if (!invoice) {
    apiLogger.error({ reference }, 'Invoice not found');
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Find the payment record
  const payment = invoice.payments[0];
  if (!payment) {
    apiLogger.error({ reference }, 'Payment record not found for invoice');
    return NextResponse.json(
      { error: "Payment record not found" },
      { status: 404 }
    );
  }

  // SECURITY CHECK 2: Double-check payment status with PayNow servers
  // NEVER trust webhook data alone - always verify with the payment gateway
  if (!payment.pollUrl) {
    apiLogger.error({ paymentId: payment.id }, 'No poll URL for payment - cannot verify');
    // If no pollUrl, we can only trust the webhook signature
    // This should not happen in normal operation - pollUrl should be stored during payment initiation
    apiLogger.warn({ paymentId: payment.id }, 'Proceeding with webhook data only - SECURITY RISK');
  }

  let statusCheck;
  if (payment.pollUrl) {
    // Verify payment status directly with PayNow servers
    apiLogger.info({ pollUrl: payment.pollUrl }, 'Verifying payment with PayNow API');
    statusCheck = await checkPaymentStatus(payment.pollUrl);

    if (!statusCheck.success) {
      apiLogger.error({ error: statusCheck.error }, 'Payment status check failed');

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          errorMessage: statusCheck.error || "Payment verification failed",
          paymentMetadata: statusCheck as any
        }
      });

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 500 }
      );
    }
  } else {
    // Fallback: use webhook data (less secure but webhook signature was verified)
    statusCheck = { success: true, paid: status === 'Paid', status, amount };
  }

  // SECURITY CHECK 3: Verify payment is actually paid
  if (!statusCheck.paid || statusCheck.status !== 'Paid') {
    apiLogger.warn(
      {
        paid: statusCheck.paid,
        status: statusCheck.status,
      },
      'Payment not confirmed as paid'
    );

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        errorMessage: `Payment status: ${statusCheck.status}`,
        paymentMetadata: statusCheck as any
      }
    });

    return NextResponse.json({
      success: false,
      message: "Payment not confirmed",
    });
  }

  // SECURITY CHECK 4: Verify amount matches (using integer comparison to avoid floating-point issues)
  // Convert to cents for precise comparison
  const expectedAmountCents = Math.round(Number(invoice.amount) * 100);
  const paidAmountCents = Math.round(Number(statusCheck.amount) * 100);

  if (expectedAmountCents !== paidAmountCents) {
    apiLogger.error(
      {
        expected: expectedAmountCents / 100,
        expectedCents: expectedAmountCents,
        paid: paidAmountCents / 100,
        paidCents: paidAmountCents,
        invoice: invoice.invoiceNumber,
      },
      'Payment amount mismatch - possible fraud'
    );

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        errorMessage: `Amount mismatch: expected ${expectedAmountCents / 100} (${expectedAmountCents} cents), got ${paidAmountCents / 100} (${paidAmountCents} cents)`,
        paymentMetadata: {
          ...statusCheck,
          expectedAmountCents,
          paidAmountCents,
          mismatchDetected: true,
        } as any
      }
    });

    return NextResponse.json(
      { error: "Payment amount mismatch" },
      { status: 400 }
    );
  }

  // Generate verification hash for internal records
  const verificationHash = generatePaymentVerificationHash(
    payment.id,
    String(amount),
    paynowReference
  );

  // Payment verified successfully - update records
  const now = new Date();

  // ALL CHECKS PASSED - Now we can safely process the payment
  // Wrap all critical database operations in a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        verified: true,
        verifiedAt: new Date(),
        paynowReference: paynowReference,
        verificationHash,
        paymentMetadata: statusCheck as any
      }
    });

    // Update invoice status
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        paidAt: now,
      }
    });

    // Log to audit trail
    await tx.auditLog.create({
      data: {
        userId: invoice.tenant.users[0]?.id || 'system',
        tenantId: invoice.tenantId,
        action: "PAYMENT_CONFIRMED",
        entityType: "Payment",
        entityId: payment.id,
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          paymentId: payment.id,
          amount: amount,
          paynowReference: paynowReference,
          verified: true,
          analytics: {
            event: "purchase",
            value: Number(amount),
            currency: invoice.currency,
          },
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    // Perform auto-actions within the transaction
    await performAutoActionsInTransaction(tx, invoice, updatedPayment);

    return { updatedPayment };
  });

  // Send emails outside transaction (so email failures don't rollback payment)
  await sendPaymentEmails(invoice, result.updatedPayment);

  // SECURITY: Mark webhook as processed to prevent replay attacks
  processedWebhooks.set(reference, startTime);

  return NextResponse.json({
    success: true,
    message: 'Payment confirmed and processed',
  });
});

/**
 * Perform automatic database actions within a transaction
 * This ensures atomicity - all actions succeed or all fail together
 */
async function performAutoActionsInTransaction(tx: any, invoice: any, payment: any) {
  const actionsPerformed = {
    upgraded: false,
    unsuspended: false,
    oldPlan: null as string | null,
  };

  // Auto-upgrade if this is an upgrade invoice
  if (
    invoice.type === "UPGRADE" &&
    invoice.plan &&
    !payment.upgradeActioned
  ) {
    const tenant = await tx.tenant.findUnique({
      where: { id: invoice.tenantId },
    });

    if (tenant) {
      const oldPlan = tenant.plan;
      actionsPerformed.oldPlan = oldPlan;

      await tx.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          plan: invoice.plan,
          monthlyRevenue:
            invoice.plan === 'FREE' ? 0 : invoice.plan === 'BASIC' ? 29.99 : 99.99,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: 'system',
          tenantId: invoice.tenantId,
          action: 'AUTO_UPGRADE',
          entityType: 'Tenant',
          entityId: invoice.tenantId,
          oldValues: { plan: tenant.plan },
          newValues: { plan: invoice.plan },
          details: {
            paymentId: payment?.id || invoice.id,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            analytics: {
              event: 'subscription_upgrade',
              from: tenant.plan,
              to: invoice.plan,
            },
          },
          ipAddress: 'system',
          userAgent: 'auto-action',
        },
      });

      actionsPerformed.upgraded = true;
      apiLogger.info(
        {
          tenantId: invoice.tenantId,
          fromPlan: tenant.plan,
          toPlan: invoice.plan,
        },
        'Auto-upgraded tenant'
      );
    }
  }

  // Auto-unsuspend if account was suspended
  if (
    invoice.tenant.status === "SUSPENDED" &&
    !payment.unsuspendActioned
  ) {
    await tx.tenant.update({
      where: { id: invoice.tenantId },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: 'system',
        tenantId: invoice.tenantId,
        action: 'AUTO_UNSUSPEND',
        entityType: 'Tenant',
        entityId: invoice.tenantId,
        details: {
          paymentId: payment?.id || invoice.id,
          reason: 'Payment confirmed',
          analytics: {
            event: 'account_unsuspended',
          },
        },
        ipAddress: 'system',
        userAgent: 'auto-action',
      },
    });

    actionsPerformed.unsuspended = true;
    apiLogger.info({ tenantId: invoice.tenantId }, 'Auto-unsuspended tenant');
  }

  // Mark which actions were performed
  await tx.payment.update({
    where: { id: payment.id },
    data: {
      upgradeActioned: actionsPerformed.upgraded || payment.upgradeActioned,
      unsuspendActioned: actionsPerformed.unsuspended || payment.unsuspendActioned,
    }
  });

  return actionsPerformed;
}

/**
 * Send payment-related emails outside the transaction
 * Email failures should not rollback payment confirmation
 */
async function sendPaymentEmails(invoice: any, payment: any) {
  try {
    // Send payment confirmation email with invoice
    if (!payment.emailSent) {
      const invoicePdf = await generateInvoicePdf(invoice.id);
      const emailResult = await sendPaymentConfirmationEmail(
        invoice.tenant.email,
        invoice.tenant.name,
        invoice.invoiceNumber,
        invoice.amount.toString(),
        payment?.paynowReference || '',
        invoicePdf || undefined
      );

      if (emailResult) {
        apiLogger.info(
          { email: invoice.tenant.email },
          'Payment confirmation email sent'
        );
        // Update payment record to mark email as sent
        await prisma.payment.update({
          where: { id: payment.id },
          data: { emailSent: true }
        });
      } else {
        apiLogger.error('Failed to send payment confirmation email');
      }
    }

    // Send admin notification
    if (!payment.adminNotified) {
      const adminAlertResult = await sendAdminPaymentAlert(
        invoice.tenant.name,
        invoice.invoiceNumber,
        invoice.amount.toString(),
        payment?.paynowReference || ''
      );

      if (adminAlertResult) {
        apiLogger.info('Admin payment alert sent');
        // Update payment record to mark admin as notified
        await prisma.payment.update({
          where: { id: payment.id },
          data: { adminNotified: true }
        });
      } else {
        apiLogger.error('Failed to send admin payment alert');
      }
    }

    // Send upgrade notification email if tenant was upgraded
    if (invoice.type === "UPGRADE" && invoice.plan) {
      try {
        const { emailService } = await import('@/lib/email');
        const tenantAdmin = await prisma.user.findFirst({
          where: {
            tenantId: invoice.tenantId,
            role: 'TENANT_ADMIN'
          }
        });

        if (tenantAdmin) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: invoice.tenantId }
          });

          if (tenant) {
            await emailService.sendAdminUpgradeAlert(
              invoice.tenant.name,
              tenantAdmin.name,
              tenantAdmin.email,
              tenant.plan, // Current plan after upgrade
              invoice.plan,
              Number(invoice.amount).toFixed(2)
            );
          }
        }
      } catch (emailError) {
        apiLogger.error({ error: emailError }, 'Failed to send admin upgrade alert');
        // Don't fail if email sending fails
      }
    }
  } catch (error) {
    apiLogger.error({ error }, 'Error sending payment emails');
    // Don't throw - payment is already confirmed, just log the error
  }
}

// Also handle GET requests for status checks
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { error: 'Reference is required' },
      { status: 400 }
    );
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: reference },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

    const payment = invoice.payments[0];

    return NextResponse.json({
      invoiceStatus: invoice.status,
      paymentStatus: payment?.status,
      verified: payment?.verified,
      amount: invoice.amount
    });
  } catch (error) {
    apiLogger.error({ error }, 'Payment status check error');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

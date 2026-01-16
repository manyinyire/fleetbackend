import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, successResponse } from '@/lib/api-middleware';
import { checkPaymentStatus } from '@/lib/paynow';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';
import { handleCommonError } from '@/lib/error-handler';
import { apiLogger } from '@/lib/logger';

/**
 * Manual payment verification endpoint
 * Used when PayNow webhook doesn't trigger (common in test mode)
 */
export const POST = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  const body = await request.json();
  const { paymentId } = body;

  if (!paymentId) {
    return successResponse({ error: 'Payment ID is required' }, 400);
  }

  // Get the payment record
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          tenant: true
        }
      }
    }
  });

  if (!payment) {
    return successResponse({ error: 'Payment not found' }, 404);
  }

  // Verify tenant access
  if (payment.tenantId !== tenantId && user.role !== 'SUPER_ADMIN') {
    return successResponse({ error: 'Unauthorized' }, 403);
  }

  // If already verified, return current status
  if (payment.verified && payment.status === 'PAID') {
    return successResponse({
      success: true,
      alreadyVerified: true,
      payment: {
        status: payment.status,
        verified: payment.verified,
      },
      invoice: {
        status: payment.invoice.status,
      }
    });
  }

  // Check payment status with PayNow
  if (!payment.pollUrl) {
    return successResponse({ error: 'No poll URL available for this payment' }, 400);
  }

  apiLogger.info({ paymentId }, 'Checking payment status');
  const statusCheck = await checkPaymentStatus(payment.pollUrl);

  if (!statusCheck.success) {
    apiLogger.error({ paymentId, error: statusCheck.error }, 'Payment status check failed');
    return successResponse({
      success: false,
      error: statusCheck.error || 'Payment verification failed'
    }, 500);
  }

  apiLogger.info({
    paymentId,
    paid: statusCheck.paid,
    status: statusCheck.status,
    amount: statusCheck.amount
  }, 'PayNow status retrieved');

  // If not paid, return current status
  if (!statusCheck.paid) {
    apiLogger.info({ paymentId, status: statusCheck.status }, 'Payment not yet paid');
    return successResponse({
      success: true,
      payment: {
        status: statusCheck.status || 'PENDING',
        verified: false,
      },
      message: 'Payment not yet completed. Current status: ' + (statusCheck.status || 'PENDING'),
    });
  }

  // Verify amount matches (skip if amount is not provided by PayNow)
  const expectedAmount = Number(payment.amount);
  const paidAmount = statusCheck.amount ? Number(statusCheck.amount) : expectedAmount;

  if (statusCheck.amount && Math.abs(expectedAmount - paidAmount) > 0.01) {
    apiLogger.error({
      paymentId,
      expected: expectedAmount,
      paid: paidAmount
    }, 'Payment amount mismatch');
    return successResponse({
      success: false,
      error: 'Payment amount mismatch'
    }, 400);
  }

  // Log if amount verification was skipped
  if (!statusCheck.amount) {
    apiLogger.warn({ paymentId }, 'Amount not provided by PayNow, skipping amount verification');
  }

  // Payment verified! Update records
  apiLogger.info({ paymentId }, 'Payment verified, updating records');

  const now = new Date();

  // Update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      verified: true,
      verifiedAt: now,
      paynowReference: statusCheck.paynowReference || statusCheck.reference,
      paymentMetadata: statusCheck as any,
    }
  });

  // Update invoice with payment details
  await prisma.invoice.update({
    where: { id: payment.invoiceId },
    data: {
      status: 'PAID',
      paidAt: now,
      paymentReference: statusCheck.paynowReference || statusCheck.reference || payment.id,
      paymentMethod: 'PAYNOW',
    }
  });

  // Log audit trail
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: payment.tenantId,
      action: 'PAYMENT_VERIFIED',
      entityType: 'Payment',
      entityId: payment.id,
      details: {
        invoiceId: payment.invoiceId,
        invoiceNumber: payment.invoice.invoiceNumber,
        amount: paidAmount,
        paynowReference: statusCheck.paynowReference,
        verifiedManually: true,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }
  });

  // Auto-upgrade if this is an upgrade invoice
  if (payment.invoice.type === 'UPGRADE' && payment.invoice.plan) {
    const oldPlan = payment.invoice.tenant.plan;

    await prisma.tenant.update({
      where: { id: payment.tenantId },
      data: {
        plan: payment.invoice.plan,
      }
    });

    apiLogger.info({ tenantId: payment.tenantId, plan: payment.invoice.plan }, 'Auto-upgraded tenant');

    // Send admin notification about upgrade
    try {
      const { emailService } = await import('@/lib/email');
      await emailService.sendAdminUpgradeAlert(
        payment.invoice.tenant.name,
        user.name,
        user.email,
        oldPlan,
        payment.invoice.plan,
        Number(payment.amount).toFixed(2)
      );
    } catch (emailError) {
      apiLogger.error({ err: emailError }, 'Failed to send admin upgrade alert');
      // Don't fail the upgrade if admin email fails
    }
  }

  // Auto-unsuspend if tenant is suspended and this clears their overdue invoices
  if (payment.invoice.tenant.status === 'SUSPENDED') {
    // Check if there are any remaining overdue invoices
    const overdueCount = await prisma.invoice.count({
      where: {
        tenantId: payment.tenantId,
        status: 'OVERDUE',
        id: { not: payment.invoiceId }, // Exclude current invoice (now paid)
      }
    });

    if (overdueCount === 0) {
      await prisma.tenant.update({
        where: { id: payment.tenantId },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          tenantId: payment.tenantId,
          action: 'AUTO_UNSUSPEND',
          entityType: 'Tenant',
          entityId: payment.tenantId,
          oldValues: { status: 'SUSPENDED' },
          newValues: { status: 'ACTIVE' },
          details: {
            reason: 'Overdue invoice paid',
            invoiceId: payment.invoiceId,
            invoiceNumber: payment.invoice.invoiceNumber,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      });

      apiLogger.info({ tenantId: payment.tenantId }, 'Auto-unsuspended tenant');
    }
  }

  // Send notifications in background (fire-and-forget for faster response)
  Promise.all([
    NotificationService.notifyPaymentSuccess(
      payment.tenantId,
      user.id,
      Number(payment.amount),
      payment.invoice.invoiceNumber
    ).catch((err) => {
      apiLogger.error({ err }, 'Payment notification failed');
    }),
    
    // Notify about upgrade if applicable
    payment.invoice.type === 'UPGRADE' && payment.invoice.plan
      ? NotificationService.notifyUpgradeSuccess(
          payment.tenantId,
          user.id,
          payment.invoice.plan
        ).catch((err) => {
          apiLogger.error({ err }, 'Upgrade notification failed');
        })
      : Promise.resolve(),
    
    // Notify about account reactivation if applicable
    payment.invoice.tenant.status === 'ACTIVE' && payment.invoice.tenant.suspendedAt === null
      ? NotificationService.notifyAccountReactivated(
          payment.tenantId,
          payment.invoice.tenant.name
        ).catch((err) => {
          apiLogger.error({ err }, 'Reactivation notification failed');
        })
      : Promise.resolve(),
  ]).catch(() => {
    // Ignore notification errors - they're logged above
  });

  apiLogger.info({ paymentId }, 'Payment verification complete');

  return successResponse({
    success: true,
    payment: {
      status: 'PAID',
      verified: true,
      paynowReference: statusCheck.paynowReference || statusCheck.reference || payment.id,
    },
    invoice: {
      status: 'PAID',
      paymentReference: statusCheck.paynowReference || statusCheck.reference || payment.id,
    }
  });
});

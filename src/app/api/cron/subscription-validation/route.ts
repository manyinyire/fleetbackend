import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';

/**
 * POST /api/cron/subscription-validation
 * Daily cron job to validate subscriptions and suspend expired accounts
 * Should run every day at midnight
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      suspended: 0,
      alreadySuspended: 0,
      errors: [] as any[],
    };

    // Find all tenants with expired subscriptions that are not suspended
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            // Subscription has expired
            subscriptionEndDate: {
              lte: now,
            },
          },
          {
            // Trial has expired and no active subscription
            isInTrial: true,
            trialEndDate: {
              lte: now,
            },
          },
        ],
      },
      include: {
        users: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    apiLogger.info(
      { count: expiredTenants.length },
      'Found tenants with expired subscriptions'
    );

    // Suspend each expired tenant
    for (const tenant of expiredTenants) {
      try {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            status: 'SUSPENDED',
            suspendedAt: now,
          },
        });

        // Log the suspension
        await prisma.auditLog.create({
          data: {
            userId: 'system',
            tenantId: tenant.id,
            action: 'AUTO_SUSPEND',
            entityType: 'Tenant',
            entityId: tenant.id,
            oldValues: { status: 'ACTIVE' },
            newValues: { status: 'SUSPENDED' },
            details: {
              reason: 'Subscription expired',
              subscriptionEndDate: tenant.subscriptionEndDate,
              trialEndDate: tenant.trialEndDate,
              isInTrial: tenant.isInTrial,
              analytics: {
                event: 'account_suspended',
                reason: 'subscription_expired',
              },
            },
            ipAddress: 'system',
            userAgent: 'cron-job',
          },
        });

        results.suspended++;

        apiLogger.info(
          {
            tenantId: tenant.id,
            tenantName: tenant.name,
            subscriptionEndDate: tenant.subscriptionEndDate,
          },
          'Tenant suspended due to expired subscription'
        );

        // TODO: Send email notification to tenant about suspension
        // await sendSuspensionNotification(tenant.email, tenant.name);
      } catch (error) {
        apiLogger.error(
          { err: error, tenantId: tenant.id },
          'Error suspending tenant'
        );
        results.errors.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Also check for tenants with overdue invoices (30+ days)
    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - 30);

    const tenantsWithOverdueInvoices = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        invoices: {
          some: {
            status: 'OVERDUE',
            dueDate: {
              lte: overdueThreshold,
            },
          },
        },
      },
      include: {
        invoices: {
          where: {
            status: 'OVERDUE',
            dueDate: {
              lte: overdueThreshold,
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    apiLogger.info(
      { count: tenantsWithOverdueInvoices.length },
      'Found tenants with overdue invoices (30+ days)'
    );

    for (const tenant of tenantsWithOverdueInvoices) {
      try {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            status: 'SUSPENDED',
            suspendedAt: now,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: 'system',
            tenantId: tenant.id,
            action: 'AUTO_SUSPEND',
            entityType: 'Tenant',
            entityId: tenant.id,
            oldValues: { status: 'ACTIVE' },
            newValues: { status: 'SUSPENDED' },
            details: {
              reason: 'Overdue invoices (30+ days)',
              overdueInvoiceCount: tenant.invoices.length,
              oldestInvoiceDate: tenant.invoices[0]?.dueDate,
              analytics: {
                event: 'account_suspended',
                reason: 'payment_overdue',
              },
            },
            ipAddress: 'system',
            userAgent: 'cron-job',
          },
        });

        results.suspended++;

        apiLogger.info(
          {
            tenantId: tenant.id,
            tenantName: tenant.name,
            overdueInvoices: tenant.invoices.length,
          },
          'Tenant suspended due to overdue invoices'
        );
      } catch (error) {
        apiLogger.error(
          { err: error, tenantId: tenant.id },
          'Error suspending tenant for overdue invoices'
        );
        results.errors.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return successResponse({
      message: 'Subscription validation completed',
      results: {
        totalSuspended: results.suspended,
        expiredSubscriptions: expiredTenants.length,
        overdueInvoices: tenantsWithOverdueInvoices.length,
        errors: results.errors,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Subscription validation cron error');
    return Response.json(
      {
        error: 'Failed to validate subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

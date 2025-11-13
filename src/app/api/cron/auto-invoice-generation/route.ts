import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invoiceGenerator } from '@/lib/invoice-generator';
import { emailService } from '@/lib/email';
import logger from '@/lib/logger';

/**
 * Auto-Invoice Generation Cron Job
 *
 * This cron job should run daily to:
 * 1. Find tenants with billing dates 7 days from now
 * 2. Generate invoices for paid subscriptions (BASIC, PREMIUM)
 * 3. Send payment notifications to tenants
 * 4. Update next billing date upon successful payment
 *
 * Schedule: Run daily at 00:00 UTC
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = await autoGenerateInvoices();

    return NextResponse.json({
      success: true,
      message: 'Auto-invoice generation completed',
      ...results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Auto-invoice generation cron job error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function autoGenerateInvoices() {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  // Set to start and end of day for comparison
  const targetDateStart = new Date(sevenDaysFromNow);
  targetDateStart.setHours(0, 0, 0, 0);

  const targetDateEnd = new Date(sevenDaysFromNow);
  targetDateEnd.setHours(23, 59, 59, 999);

  logger.info(`Looking for subscriptions with billing dates between ${targetDateStart.toISOString()} and ${targetDateEnd.toISOString()}`);

  // Find tenants with paid plans (BASIC or PREMIUM) whose next billing date is 7 days from now
  const tenantsToInvoice = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      plan: {
        in: ['BASIC', 'PREMIUM']
      },
      subscriptionEndDate: {
        gte: targetDateStart,
        lte: targetDateEnd
      }
    },
    include: {
      users: {
        where: {
          role: 'TENANT_ADMIN'
        },
        take: 1
      }
    }
  });

  logger.info(`Found ${tenantsToInvoice.length} tenants requiring invoice generation`);

  const generated = [];
  const errors = [];

  for (const tenant of tenantsToInvoice) {
    try {
      // Check if invoice already exists for this billing period
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          tenantId: tenant.id,
          type: 'RENEWAL',
          billingPeriod: {
            equals: tenant.subscriptionEndDate?.toISOString()
          },
          status: {
            in: ['PENDING', 'PAID']
          }
        }
      });

      if (existingInvoice) {
        logger.info(`Invoice already exists for tenant ${tenant.id}, skipping`);
        continue;
      }

      // Get plan pricing
      const planConfig = await prisma.planConfiguration.findUnique({
        where: { plan: tenant.plan }
      });

      if (!planConfig) {
        throw new Error(`Plan configuration not found for ${tenant.plan}`);
      }

      const amount = Number(planConfig.monthlyPrice);

      // Generate invoice
      const { invoice, pdf } = await invoiceGenerator.generateInvoice({
        tenantId: tenant.id,
        type: 'RENEWAL',
        plan: tenant.plan,
        amount,
        description: `${tenant.plan} Plan Subscription - Monthly Renewal`,
        billingPeriod: tenant.subscriptionEndDate?.toISOString() || new Date().toISOString()
      });

      logger.info(`Generated invoice ${invoice.invoiceNumber} for tenant ${tenant.id}`);

      // TODO: Send payment notification email to tenant admin
      // Need to implement sendInvoiceNotificationEmail in email service
      const adminUser = tenant.users[0];
      if (adminUser) {
        logger.info(`Invoice generated for ${adminUser.email} - notification email not yet implemented`);
        // const emailSent = await emailService.sendInvoiceNotificationEmail(
        //   adminUser.email,
        //   {
        //     invoiceNumber: invoice.invoiceNumber,
        //     amount,
        //     dueDate: invoice.dueDate.toLocaleDateString(),
        //     companyName: tenant.name,
        //     userName: adminUser.name,
        //     plan: tenant.plan,
        //     paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/invoices/${invoice.id}/pay`
        //   },
        //   pdf
        // );
      }

      generated.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount
      });

    } catch (error) {
      logger.error({ error, tenantId: tenant.id }, 'Error generating invoice for tenant');
      errors.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    totalProcessed: tenantsToInvoice.length,
    generated: generated.length,
    errors: errors.length,
    generatedInvoices: generated,
    errorDetails: errors
  };
}

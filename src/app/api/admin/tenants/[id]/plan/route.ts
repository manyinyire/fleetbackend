import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/lib/admin-middleware';
import { changeTenantPlanSchema, validateSchema } from '@/lib/admin-validators';
import { AuditLogger } from '@/lib/audit-logger';
import { invoiceGenerator } from '@/lib/invoice-generator';
import { emailService } from '@/lib/email';

// PATCH /api/admin/tenants/[id]/plan - Change tenant plan (with invoice creation for upgrades)
export const PATCH = withSuperAdmin(
  async (request: NextRequest, session: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json();

    // Extract skipInvoice flag
    const { skipInvoice, ...planData } = body;

    // Validate plan
    const validation = validateSchema(changeTenantPlanSchema, planData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { plan } = validation.data!;

    // Get current tenant
    const currentTenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          where: {
            role: { contains: 'TENANT_ADMIN' }
          },
          take: 1
        }
      }
    });

    if (!currentTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const planOrder = ['FREE', 'BASIC', 'PREMIUM'];
    const currentIndex = planOrder.indexOf(currentTenant.plan);
    const newIndex = planOrder.indexOf(plan);
    const isUpgrade = newIndex > currentIndex;

    // If upgrading and not skipping invoice, create upgrade invoice
    if (isUpgrade && !skipInvoice && plan !== 'FREE') {
      try {
        const { invoice, pdf } = await invoiceGenerator.createUpgradeInvoice(
          id,
          plan as 'BASIC' | 'PREMIUM',
          currentTenant.plan
        );

        // Send invoice via email immediately
        const adminUser = currentTenant.users[0];
        if (adminUser) {
          const invoiceData = {
            invoiceNumber: invoice.invoiceNumber,
            amount: Number(invoice.amount),
            dueDate: invoice.dueDate.toLocaleDateString(),
            companyName: currentTenant.name,
            userName: adminUser.name
          };

          await emailService.sendInvoiceEmail(adminUser.email, invoiceData, pdf);
        }

        // Log the upgrade invoice creation
        await AuditLogger.log({
          action: 'CREATE_UPGRADE_INVOICE',
          entityType: 'INVOICE',
          entityId: invoice.id,
          newValues: {
            invoiceNumber: invoice.invoiceNumber,
            plan: plan,
            amount: Number(invoice.amount)
          },
          metadata: {
            tenantId: id,
            tenantName: currentTenant.name,
            fromPlan: currentTenant.plan,
            toPlan: plan
          }
        });

        // Return invoice info - don't upgrade yet, wait for payment
        return NextResponse.json({
          success: true,
          message:
            'Upgrade invoice created and sent. Plan will be upgraded automatically upon payment.',
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: Number(invoice.amount),
            dueDate: invoice.dueDate,
            status: invoice.status,
            plan: invoice.plan
          },
          tenant: {
            id: currentTenant.id,
            plan: currentTenant.plan // Still on current plan until payment
          }
        });
      } catch (invoiceError) {
        console.error('Error creating upgrade invoice:', invoiceError);
        return NextResponse.json({ error: 'Failed to create upgrade invoice' }, { status: 500 });
      }
    }

    // For downgrades or when skipInvoice is true, update plan immediately
    const monthlyRevenue = plan === 'FREE' ? 0 : plan === 'BASIC' ? 29.99 : 99.99;

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        plan,
        monthlyRevenue
      }
    });

    // Log the change
    await AuditLogger.log({
      action: 'UPDATE_PLAN',
      entityType: 'TENANT',
      entityId: id,
      oldValues: { plan: currentTenant.plan },
      newValues: { plan },
      metadata: { tenantName: currentTenant.name, skipInvoice }
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant
    });
  }
);

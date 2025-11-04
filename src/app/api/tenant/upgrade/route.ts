import { NextRequest, NextResponse } from 'next/server';
import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { invoiceGenerator } from '@/lib/invoice-generator';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireTenantForDashboard();
    const body = await request.json();
    const { newPlan } = body;

    // Validate plan
    if (!['BASIC', 'PREMIUM'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be BASIC or PREMIUM' },
        { status: 400 }
      );
    }

    // Get current tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: {
            email: user.email,
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if already on this plan or higher
    const planOrder = ['FREE', 'BASIC', 'PREMIUM'];
    const currentIndex = planOrder.indexOf(tenant.plan);
    const newIndex = planOrder.indexOf(newPlan);

    if (newIndex <= currentIndex) {
      return NextResponse.json(
        { error: `Cannot upgrade to ${newPlan}. Current plan is ${tenant.plan} or higher.` },
        { status: 400 }
      );
    }

    // Create upgrade invoice
    const { invoice, pdf } = await invoiceGenerator.createUpgradeInvoice(tenantId, newPlan as 'BASIC' | 'PREMIUM');

    // Update invoice with current plan info for upgrade calculation
    // The invoice generator already calculates the upgrade amount correctly

    // Send invoice via email immediately
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      dueDate: invoice.dueDate.toLocaleDateString(),
      companyName: tenant.name,
      userName: tenant.users[0]?.name || user.name || 'User',
    };

    await emailService.sendInvoiceEmail(user.email, invoiceData, pdf);

    return NextResponse.json({
      success: true,
      message: 'Upgrade invoice created and sent successfully',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        dueDate: invoice.dueDate,
        status: invoice.status,
        plan: invoice.plan,
      },
    });
  } catch (error) {
    console.error('Error creating upgrade invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create upgrade invoice' },
      { status: 500 }
    );
  }
}


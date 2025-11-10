import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, validateBody } from '@/lib/api-middleware';
import { invoiceGenerator } from '@/lib/invoice-generator';
import { emailService } from '@/lib/email';
import { z } from 'zod';

// Validation schema for plan upgrade
const upgradePlanSchema = z.object({
  newPlan: z.enum(['BASIC', 'PREMIUM'], {
    errorMap: () => ({ message: 'Invalid plan. Must be BASIC or PREMIUM' }),
  }),
});

export const POST = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  const data = await validateBody(request, upgradePlanSchema);

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
    return successResponse({ error: 'Tenant not found' }, 404);
  }

  // Check if already on this plan or higher
  const planOrder = ['FREE', 'BASIC', 'PREMIUM'];
  const currentIndex = planOrder.indexOf(tenant.plan);
  const newIndex = planOrder.indexOf(data.newPlan);

  if (newIndex <= currentIndex) {
    return successResponse(
      {
        error: `Cannot upgrade to ${data.newPlan}. Current plan is ${tenant.plan} or higher.`,
      },
      400
    );
  }

  // Check if there's already a pending upgrade invoice
  const pendingInvoice = await prisma.invoice.findFirst({
    where: {
      tenantId,
      type: 'UPGRADE',
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (pendingInvoice) {
    return successResponse(
      {
        error: `You already have a pending upgrade invoice (${pendingInvoice.invoiceNumber}). Please pay or cancel it before creating a new upgrade request.`,
        existingInvoice: {
          id: pendingInvoice.id,
          invoiceNumber: pendingInvoice.invoiceNumber,
          amount: Number(pendingInvoice.amount),
          plan: pendingInvoice.plan,
          dueDate: pendingInvoice.dueDate,
        },
      },
      400
    );
  }

  // Create upgrade invoice
  const { invoice, pdf } = await invoiceGenerator.createUpgradeInvoice(
    tenantId,
    data.newPlan as 'BASIC' | 'PREMIUM'
  );

  // Send invoice via email immediately
  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    amount: Number(invoice.amount),
    dueDate: invoice.dueDate.toLocaleDateString(),
    companyName: tenant.name,
    userName: tenant.users[0]?.name || user.name || 'User',
  };

  await emailService.sendInvoiceEmail(user.email, invoiceData, pdf);

  return successResponse({
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
});

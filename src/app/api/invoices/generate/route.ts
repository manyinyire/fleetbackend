import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, validateBody } from '@/lib/api-middleware';
import { invoiceGenerator } from '@/lib/invoice-generator';
import { emailService } from '@/lib/email';
import { InvoiceType } from '@prisma/client';
import { z } from 'zod';

// Validation schema for generating an invoice
const generateInvoiceSchema = z.object({
  type: z.nativeEnum(InvoiceType),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']),
  description: z.string().optional(),
});

export const POST = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const data = await validateBody(request, generateInvoiceSchema);

  // Generate invoice
  const { invoice, pdf } = await invoiceGenerator.generateInvoice({
    tenantId: tenantId,
    type: data.type,
    plan: data.plan,
    amount: 0, // Will be calculated based on plan
    description: data.description,
  });

  // Get tenant admin to send email
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        where: {
          role: 'TENANT_ADMIN',
        },
        take: 1,
      },
    },
  });

  // Send invoice via email to tenant admin
  if (tenant?.users[0]) {
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      dueDate: invoice.dueDate.toLocaleDateString(),
      companyName: tenant.name,
      userName: tenant.users[0].name,
    };

    await emailService.sendInvoiceEmail(tenant.users[0].email, invoiceData, pdf);
  }

  return successResponse({
    message: 'Invoice generated and sent successfully',
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      status: invoice.status,
    },
  });
});

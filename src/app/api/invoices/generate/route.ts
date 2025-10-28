import { NextRequest, NextResponse } from 'next/server';
import { invoiceGenerator } from '@/lib/invoice-generator';
import { emailService } from '@/lib/email';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { type, plan, description } = await request.json();

    if (!type || !plan) {
      return NextResponse.json(
        { error: 'Type and plan are required' },
        { status: 400 }
      );
    }

    const { invoice, pdf } = await invoiceGenerator.generateInvoice({
      tenantId: session.user.tenantId,
      type,
      plan,
      amount: 0, // Will be calculated based on plan
      description
    });

    // Send invoice via email
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      include: {
        users: {
          where: {
            role: 'TENANT_ADMIN'
          },
          take: 1
        }
      }
    });

    if (tenant?.users[0]) {
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        dueDate: invoice.dueDate.toLocaleDateString(),
        companyName: tenant.name,
        userName: tenant.users[0].name
      };

      await emailService.sendInvoiceEmail(tenant.users[0].email, invoiceData, pdf);
    }

    return NextResponse.json({ 
      message: 'Invoice generated and sent successfully',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        status: invoice.status
      }
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
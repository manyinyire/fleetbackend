import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await requireRole('SUPER_ADMIN');
    const invoiceId = id;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // TODO: Implement actual payment retry logic with payment provider
    // For now, just update the invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PENDING'
      }
    });

    // Log the retry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PAYMENT_RETRY',
        entityType: 'Invoice',
        entityId: invoiceId,
        newValues: {
          invoiceNumber: invoice.invoiceNumber,
          tenantId: invoice.tenantId,
          retryAt: new Date().toISOString()
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Payment retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  } finally {
  }
}


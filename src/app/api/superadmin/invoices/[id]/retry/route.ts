import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { createPayment } from '@/lib/paynow';

const STALE_PAYMENT_THRESHOLD = 30 * 60 * 1000; // 30 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;

  try {
    const adminUser = await requireRole('SUPER_ADMIN');

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          where: {
            status: 'PENDING',
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    if (!invoice.tenant) {
      return NextResponse.json(
        { error: 'Invoice is not associated with a tenant' },
        { status: 400 }
      );
    }

    // Cancel stale pending payments or block retry if payment is still fresh
    if (invoice.payments.length > 0) {
      const pendingPayment = invoice.payments[0];
      const paymentAge = Date.now() - new Date(pendingPayment.createdAt).getTime();

      if (paymentAge > STALE_PAYMENT_THRESHOLD) {
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: 'CANCELLED',
            paymentMetadata: {
              ...(pendingPayment.paymentMetadata as object || {}),
              cancelledReason: 'Retry initiated by super admin',
              cancelledAt: new Date().toISOString(),
            },
          },
        });
      } else {
        return NextResponse.json(
          { error: 'A payment attempt is already pending. Please try again shortly.' },
          { status: 409 }
        );
      }
    }

    const tempPayment = await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency || 'USD',
        paymentMethod: 'paynow',
        status: 'PENDING',
        verified: false,
        paymentMetadata: {
          initiatedBy: adminUser.id,
          retry: true,
        },
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const customReturnUrl = `${baseUrl}/payments/success?paymentId=${tempPayment.id}&invoiceId=${invoice.id}`;

    const paynowResponse = await createPayment(
      invoice.invoiceNumber,
      Number(invoice.amount),
      invoice.tenant.email,
      invoice.description || `Invoice ${invoice.invoiceNumber}`,
      customReturnUrl
    );

    if (!paynowResponse.success) {
      await prisma.payment.delete({ where: { id: tempPayment.id } });
      return NextResponse.json(
        { error: paynowResponse.error || 'Payment initiation failed' },
        { status: 502 }
      );
    }

    const payment = await prisma.payment.update({
      where: { id: tempPayment.id },
      data: {
        pollUrl: paynowResponse.pollUrl,
        redirectUrl: paynowResponse.redirectUrl,
        paymentMetadata: {
          ...((tempPayment.paymentMetadata as object) || {}),
          hash: paynowResponse.hash,
        },
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'PAYMENT_RETRY',
        entityType: 'Invoice',
        entityId: invoice.id,
        tenantId: invoice.tenantId,
        newValues: {
          invoiceNumber: invoice.invoiceNumber,
          paymentId: payment.id,
          retryAt: new Date().toISOString(),
          amount: invoice.amount.toString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: paynowResponse.redirectUrl,
      pollUrl: paynowResponse.pollUrl,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: invoice.id,
    });
  } catch (error) {
    console.error('Payment retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}
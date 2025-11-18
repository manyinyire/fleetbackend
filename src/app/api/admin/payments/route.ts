import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";
import { apiLogger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

interface AuthSession {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers }) as AuthSession;

    if (!session?.user || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const verified = searchParams.get("verified");
    const reconciled = searchParams.get("reconciled");
    const tenantId = searchParams.get("tenantId");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PaymentWhereInput = {};
    if (status) where.status = status;
    if (verified !== null && verified !== undefined) {
      where.verified = verified === "true";
    }
    if (reconciled !== null && reconciled !== undefined) {
      where.reconciled = reconciled === "true";
    }
    if (tenantId) where.tenantId = tenantId;

    // Fetch payments with tenant and invoice info
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
            }
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              type: true,
              dueDate: true,
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    // Calculate statistics
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', verified: true }
    });

    const unreconciledCount = await prisma.payment.count({
      where: { verified: true, reconciled: false }
    });

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: stats.map(s => ({ status: s.status, count: s._count.status })),
        totalRevenue: totalRevenue._sum.amount || 0,
        unreconciledCount,
      },
    });
  } catch (error) {
    apiLogger.error({ err: error }, "Failed to fetch payments");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update payment (for reconciliation)
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers }) as AuthSession;

    if (!session?.user || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, reconciled, reconNotes } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: { select: { name: true } }, invoice: { select: { invoiceNumber: true } } }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment reconciliation status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        reconciled: reconciled ?? payment.reconciled,
        reconciledAt: reconciled ? new Date() : payment.reconciledAt,
        reconciledBy: reconciled ? session.user.id : payment.reconciledBy,
        reconciliationNotes: reconNotes ?? payment.reconciliationNotes,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          }
        }
      }
    });

    apiLogger.info({
      paymentId,
      tenantName: payment.tenant.name,
      invoiceNumber: payment.invoice.invoiceNumber,
      reconciled,
      reconciledBy: session.user.id
    }, 'Payment reconciliation status updated');

    return NextResponse.json({
      success: true,
      payment: updatedPayment
    });
  } catch (error) {
    apiLogger.error({ err: error }, "Failed to update payment");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

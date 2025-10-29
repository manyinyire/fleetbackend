import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
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
    const where: any = {};
    if (status) where.status = status;
    if (verified !== null && verified !== undefined) {
      where.verified = verified === "true";
    }
    if (reconciled !== null && reconciled !== undefined) {
      where.reconciled = reconciled === "true";
    }
    if (tenantId) where.tenantId = tenantId;

    // Get payments with related data
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              slug: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              description: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate statistics
    const stats = await prisma.payment.groupBy({
      by: ["status"],
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const totalRevenue = await prisma.payment.aggregate({
      where: { status: "PAID", verified: true },
      _sum: { amount: true },
    });

    const unreconciledCount = await prisma.payment.count({
      where: { status: "PAID", verified: true, reconciled: false },
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
        byStatus: stats,
        totalRevenue: totalRevenue._sum.amount || 0,
        unreconciledCount,
      },
    });
  } catch (error) {
    console.error("Fetch payments error:", error);
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
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
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

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        reconciled: reconciled !== undefined ? reconciled : undefined,
        reconciledAt: reconciled ? new Date() : undefined,
        reconciledBy: reconciled ? session.user.id : undefined,
        reconNotes: reconNotes !== undefined ? reconNotes : undefined,
      },
      include: {
        tenant: true,
        invoice: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        tenantId: null,
        action: "PAYMENT_RECONCILED",
        entityType: "Payment",
        entityId: payment.id,
        details: {
          reconciled,
          reconNotes,
          amount: payment.amount.toString(),
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

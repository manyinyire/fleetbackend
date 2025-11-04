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

    // TODO: Payment model doesn't exist in schema yet - returning empty data for now
    // This route should be updated once Payment model is added to schema
    const payments: any[] = [];
    const total = 0;

    // Calculate statistics
    const stats: any[] = [];

    const totalRevenue = { _sum: { amount: null } };

    const unreconciledCount = 0;

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

    // TODO: Payment model doesn't exist in schema yet
    // This route should be updated once Payment model is added to schema
    return NextResponse.json(
      { error: "Payment model not implemented yet" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

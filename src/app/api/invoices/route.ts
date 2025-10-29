import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Build where clause based on user role
    const where: any = {};
    
    if (session.user.role !== "SUPER_ADMIN") {
      // Regular users can only see their own tenant's invoices
      where.tenantId = session.user.tenantId;
    }

    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            verified: true,
            amount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const {
      tenantId,
      description,
      amount,
      type,
      subscriptionPlan,
      dueDate,
    } = body;

    if (!tenantId || !description || !amount || !type || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${String(parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1).padStart(6, "0")}`
      : "INV-000001";

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        description,
        amount,
        currency: "USD",
        type,
        subscriptionPlan: subscriptionPlan || null,
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
      include: {
        tenant: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        tenantId,
        action: "INVOICE_CREATED",
        entityType: "Invoice",
        entityId: invoice.id,
        details: {
          invoiceNumber: invoice.invoiceNumber,
          amount: amount.toString(),
          type,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

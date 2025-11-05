import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPayment, generatePaymentVerificationHash } from "@/lib/paynow";
import { auth } from "@/lib/auth-server";
import { paymentInitiateSchema } from "@/lib/validations";
import { createErrorResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const { invoiceId } = paymentInitiateSchema.parse(body);

    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this invoice
    if (session.user.role !== "SUPER_ADMIN" && session.user.tenantId !== invoice.tenantId) {
      return NextResponse.json(
        { error: "Unauthorized to pay this invoice" },
        { status: 403 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    // Create payment in PayNow
    const paynowResponse = await createPayment(
      invoice.invoiceNumber,
      Number(invoice.amount),
      invoice.tenant.email,
      invoice.description || `Invoice ${invoice.invoiceNumber}`
    );

    if (!paynowResponse.success) {
      return NextResponse.json(
        { error: paynowResponse.error || "Payment initiation failed" },
        { status: 500 }
      );
    }

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        gateway: "PAYNOW",
        pollUrl: paynowResponse.pollUrl,
        status: "PENDING",
        verified: false,
        paymentMetadata: {
          hash: paynowResponse.hash,
          redirectUrl: paynowResponse.redirectUrl,
        },
      },
    });

    // Log the payment initiation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        tenantId: invoice.tenantId,
        action: "PAYMENT_INITIATED",
        entityType: "Payment",
        entityId: payment.id,
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount.toString(),
          paymentId: payment.id,
          gateway: "PAYNOW",
          gaTracked: true,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: paynowResponse.redirectUrl,
      pollUrl: paynowResponse.pollUrl,
      analytics: {
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        currency: invoice.currency,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

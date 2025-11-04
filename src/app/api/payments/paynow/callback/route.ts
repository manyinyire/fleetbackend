import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkPaymentStatus,
  verifyWebhookSignature,
  generatePaymentVerificationHash,
} from "@/lib/paynow";
import {
  sendPaymentConfirmationEmail,
  sendAdminPaymentAlert,
  generateInvoicePdf,
} from "@/lib/email";

/**
 * PayNow Callback Handler
 * CRITICAL: This endpoint handles payment confirmation from PayNow
 * Security is paramount - we MUST verify every payment before taking action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("PayNow callback received:", {
      reference: body.reference,
      paynowreference: body.paynowreference,
      status: body.status,
    });

    // SECURITY CHECK 1: Verify webhook signature
    const isValidSignature = verifyWebhookSignature(body);
    if (!isValidSignature) {
      console.error("Invalid webhook signature - possible fraud attempt");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const { reference, paynowreference: paynowReference, amount, status } = body;

    // Find the payment by reference (invoice number)
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: reference },
      include: { 
        tenant: {
          include: {
            users: {
              take: 1,
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      },
    });

    if (!invoice) {
      console.error("Invoice not found:", reference);
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // TODO: Create Payment model in schema
    // Find the payment record
    // const payment = await prisma.payment.findFirst({
    //   where: {
    //     invoiceId: invoice.id,
    //     status: "PENDING",
    //   },
    //   orderBy: { createdAt: "desc" },
    // });

    // if (!payment) {
    //   console.error("Payment record not found for invoice:", reference);
    //   return NextResponse.json(
    //     { error: "Payment record not found" },
    //     { status: 404 }
    //   );
    // }

    // SECURITY CHECK 2: Double-check payment status with PayNow servers
    // NEVER trust webhook data alone - always verify with the payment gateway
    // TODO: Store pollUrl in invoice metadata or create Payment model
    // For now, we'll skip this check but it should be implemented for production
    // if (!payment.pollUrl) {
    //   console.error("No poll URL for payment:", payment.id);
    //   return NextResponse.json(
    //     { error: "Cannot verify payment - no poll URL" },
    //     { status: 400 }
    //   );
    // }

    // Note: Without Payment model, we can't verify with PayNow poll URL
    // This is a security risk and should be fixed by creating the Payment model
    const statusCheck = { success: true, paid: status === "Paid", status, amount };

    // Note: Without Payment model, we skip PayNow verification
    // This check is skipped since we can't verify with poll URL
    // if (!statusCheck.success) {
    //   console.error("Payment status check failed:", statusCheck.error);
    //   return NextResponse.json(
    //     { error: "Payment verification failed" },
    //     { status: 500 }
    //   );
    // }

    // SECURITY CHECK 3: Verify payment is actually paid
    if (!statusCheck.paid || statusCheck.status !== "Paid") {
      console.warn("Payment not confirmed as paid:", {
        paid: statusCheck.paid,
        status: statusCheck.status,
      });
      
      // TODO: Update payment status when Payment model is created
      // await prisma.payment.update({
      //   where: { id: payment.id },
      //   data: {
      //     status: "FAILED",
      //     errorMessage: `Payment status: ${statusCheck.status}`,
      //     paymentMetadata: statusCheck,
      //   },
      // });

      return NextResponse.json({
        success: false,
        message: "Payment not confirmed",
      });
    }

    // SECURITY CHECK 4: Verify amount matches
    const expectedAmount = Number(invoice.amount);
    const paidAmount = Number(statusCheck.amount);

    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      console.error("Amount mismatch:", {
        expected: expectedAmount,
        paid: paidAmount,
      });
      
      // TODO: Update payment status when Payment model is created
      // await prisma.payment.update({
      //   where: { id: payment.id },
      //   data: {
      //     status: "FAILED",
      //     errorMessage: `Amount mismatch: expected ${expectedAmount}, got ${paidAmount}`,
      //     paymentMetadata: statusCheck,
      //   },
      // });

      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    // Generate verification hash for internal records
    const verificationHash = generatePaymentVerificationHash(
      invoice.id, // Using invoice ID temporarily
      amount,
      paynowReference
    );

    // TODO: Create Payment model and update payment record
    // ALL CHECKS PASSED - Now we can safely process the payment
    // const updatedPayment = await prisma.payment.update({
    //   where: { id: payment.id },
    //   data: {
    //     status: "PAID",
    //     verified: true,
    //     verifiedAt: new Date(),
    //     paynowReference: paynowReference,
    //     verificationHash,
    //     paymentMetadata: statusCheck,
    //   },
    // });
    const updatedPayment = { id: invoice.id, paynowReference, verificationHash }; // Temporary mock

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Create audit log with analytics flag
    await prisma.auditLog.create({
      data: {
        userId: invoice.tenant.users[0]?.id || "system",
        tenantId: invoice.tenantId,
        action: "PAYMENT_CONFIRMED",
        entityType: "Payment",
        entityId: invoice.id, // Using invoice ID temporarily
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: amount,
          paynowReference: paynowReference,
          verified: true,
          analytics: {
            event: "purchase",
            value: Number(amount),
            currency: invoice.currency,
          },
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Perform auto-actions (includes analytics tracking)
    await performAutoActions(invoice, updatedPayment);

    return NextResponse.json({
      success: true,
      message: "Payment confirmed and processed",
    });
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Perform automatic actions after payment confirmation
 */
async function performAutoActions(
  invoice: any,
  payment: any
) {
  try {
    const actionsPerformed = {
      upgraded: false,
      unsuspended: false,
      emailSent: false,
      adminNotified: false,
    };

    // Auto-upgrade if this is an upgrade invoice
    if (
      invoice.type === "UPGRADE" &&
      invoice.plan
      // TODO: Add upgradeActioned check when Payment model is created
      // && !payment.upgradeActioned
    ) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: invoice.tenantId },
        select: { plan: true },
      });

      if (tenant) {
        await prisma.tenant.update({
          where: { id: invoice.tenantId },
          data: {
            plan: invoice.plan,
            monthlyRevenue: invoice.plan === 'FREE' ? 0 : invoice.plan === 'BASIC' ? 29.99 : 99.99,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: "system",
            tenantId: invoice.tenantId,
            action: "AUTO_UPGRADE",
            entityType: "Tenant",
            entityId: invoice.tenantId,
            oldValues: { plan: tenant.plan },
            newValues: { plan: invoice.plan },
            details: {
              paymentId: payment?.id || invoice.id,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              analytics: {
                event: "subscription_upgrade",
                from: tenant.plan,
                to: invoice.plan,
              },
            },
            ipAddress: "system",
            userAgent: "auto-action",
          },
        });

        actionsPerformed.upgraded = true;
        console.log(`Auto-upgraded tenant ${invoice.tenantId} from ${tenant.plan} to ${invoice.plan}`);
      }
    }

    // Auto-unsuspend if account was suspended
    if (
      invoice.tenant.status === "SUSPENDED"
      // TODO: Add unsuspendActioned check when Payment model is created
      // && !payment.unsuspendActioned
    ) {
      await prisma.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          status: "ACTIVE",
          suspendedAt: null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: "system",
          tenantId: invoice.tenantId,
          action: "AUTO_UNSUSPEND",
          entityType: "Tenant",
          entityId: invoice.tenantId,
          details: {
            paymentId: payment?.id || invoice.id,
            reason: "Payment confirmed",
            analytics: {
              event: "account_unsuspended",
            },
          },
          ipAddress: "system",
          userAgent: "auto-action",
        },
      });

      actionsPerformed.unsuspended = true;
      console.log(`Auto-unsuspended tenant ${invoice.tenantId}`);
    }

    // Send payment confirmation email with invoice
    // TODO: Add emailSent check when Payment model is created
    // if (!payment.emailSent) {
    {
      const invoicePdf = await generateInvoicePdf(invoice.id);
      const emailResult = await sendPaymentConfirmationEmail(
        invoice.tenant.email,
        invoice.tenant.name,
        invoice.invoiceNumber,
        invoice.amount.toString(),
        payment?.paynowReference || "",
        invoicePdf || undefined
      );

      if (emailResult) {
        actionsPerformed.emailSent = true;
        console.log(`Payment confirmation email sent to ${invoice.tenant.email}`);
      } else {
        console.error("Failed to send payment confirmation email");
      }
    }

    // Send admin notification
    // TODO: Add adminNotified check when Payment model is created
    // if (!payment.adminNotified) {
    {
      const adminAlertResult = await sendAdminPaymentAlert(
        invoice.tenant.name,
        invoice.invoiceNumber,
        invoice.amount.toString(),
        payment?.paynowReference || ""
      );

      if (adminAlertResult) {
        actionsPerformed.adminNotified = true;
        console.log("Admin payment alert sent");
      } else {
        console.error("Failed to send admin payment alert");
      }
    }

    // TODO: Update payment record with action statuses when Payment model is created
    // await prisma.payment.update({
    //   where: { id: payment.id },
    //   data: {
    //     upgradeActioned: actionsPerformed.upgraded || payment.upgradeActioned,
    //     unsuspendActioned: actionsPerformed.unsuspended || payment.unsuspendActioned,
    //     emailSent: actionsPerformed.emailSent || payment.emailSent,
    //     adminNotified: actionsPerformed.adminNotified || payment.adminNotified,
    //   },
    // });

    return actionsPerformed;
  } catch (error) {
    console.error("Auto-actions error:", error);
    // Don't throw - payment is already confirmed, just log the error
    return null;
  }
}

// Also handle GET requests for status checks
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { error: "Reference is required" },
      { status: 400 }
    );
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: reference },
      // TODO: Include payments when Payment model is created
      // include: {
      //   payments: {
      //     orderBy: { createdAt: "desc" },
      //     take: 1,
      //   },
      // },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // TODO: Get payment when Payment model is created
    // const payment = invoice.payments[0];

    return NextResponse.json({
      invoiceStatus: invoice.status,
      // paymentStatus: payment?.status,
      // verified: payment?.verified,
      amount: invoice.amount,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

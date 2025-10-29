import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Azaire Fleet Manager <noreply@azaire.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send exception:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Send payment confirmation email with invoice
 */
export async function sendPaymentConfirmationEmail(
  tenantEmail: string,
  tenantName: string,
  invoiceNumber: string,
  amount: string,
  paymentReference: string,
  invoicePdf?: Buffer
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .invoice-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .success-badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed</h1>
          </div>
          <div class="content">
            <p>Dear ${tenantName},</p>
            <p>We are pleased to confirm that we have received your payment.</p>
            
            <div class="invoice-details">
              <div style="text-align: center; margin-bottom: 15px;">
                <span class="success-badge">PAID</span>
              </div>
              <div class="detail-row">
                <strong>Invoice Number:</strong>
                <span>${invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <strong>Amount Paid:</strong>
                <span>$${amount} USD</span>
              </div>
              <div class="detail-row">
                <strong>Payment Reference:</strong>
                <span>${paymentReference}</span>
              </div>
              <div class="detail-row">
                <strong>Payment Date:</strong>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <p>Your invoice is attached to this email for your records.</p>
            <p>If your account was suspended, it has now been automatically reactivated.</p>
            <p>If this was an upgrade payment, your new plan features are now available.</p>

            <p>Thank you for your business!</p>

            <p>Best regards,<br/>
            <strong>Azaire Fleet Manager Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Azaire Fleet Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const attachments = invoicePdf
    ? [{ filename: `invoice-${invoiceNumber}.pdf`, content: invoicePdf }]
    : undefined;

  return sendEmail({
    to: tenantEmail,
    subject: `Payment Confirmation - Invoice ${invoiceNumber}`,
    html,
    attachments,
  });
}

/**
 * Send admin notification for new payment
 */
export async function sendAdminPaymentAlert(
  tenantName: string,
  invoiceNumber: string,
  amount: string,
  paymentReference: string
) {
  // Get super admin emails
  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { email: true },
  });

  if (superAdmins.length === 0) {
    console.warn("No super admins found to send payment alert");
    return { success: false, error: "No super admins found" };
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .payment-details { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 New Payment Received</h1>
          </div>
          <div class="content">
            <p>A new payment has been successfully processed and verified.</p>
            
            <div class="payment-details">
              <div class="detail-row">
                <strong>Tenant:</strong>
                <span>${tenantName}</span>
              </div>
              <div class="detail-row">
                <strong>Invoice Number:</strong>
                <span>${invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <strong>Amount:</strong>
                <span>$${amount} USD</span>
              </div>
              <div class="detail-row">
                <strong>Payment Reference:</strong>
                <span>${paymentReference}</span>
              </div>
              <div class="detail-row">
                <strong>Date:</strong>
                <span>${new Date().toLocaleString()}</span>
              </div>
            </div>

            <p><strong>Actions Taken:</strong></p>
            <ul>
              <li>Payment verified with PayNow</li>
              <li>Invoice marked as paid</li>
              <li>Account unsuspended (if applicable)</li>
              <li>Subscription upgraded (if applicable)</li>
              <li>Confirmation email sent to tenant</li>
            </ul>

            <p>View the payment details in the admin dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Azaire Fleet Manager - Admin Alert</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to all super admins
  const results = await Promise.all(
    superAdmins.map((admin) =>
      sendEmail({
        to: admin.email,
        subject: `🔔 New Payment: ${tenantName} - $${amount}`,
        html,
      })
    )
  );

  const allSuccess = results.every((r) => r.success);
  return { success: allSuccess, results };
}

/**
 * Generate invoice PDF (placeholder - implement with jsPDF)
 */
export async function generateInvoicePdf(
  invoiceId: string
): Promise<Buffer | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true },
    });

    if (!invoice) {
      return null;
    }

    // TODO: Implement proper PDF generation with jsPDF
    // For now, return a simple text buffer as placeholder
    const invoiceText = `
INVOICE

Invoice Number: ${invoice.invoiceNumber}
Date: ${invoice.issueDate.toLocaleDateString()}
Due Date: ${invoice.dueDate.toLocaleDateString()}

Bill To:
${invoice.tenant.name}
${invoice.tenant.email}

Description: ${invoice.description}
Amount: $${invoice.amount} ${invoice.currency}

Status: ${invoice.status}
${invoice.paidAt ? `Paid On: ${invoice.paidAt.toLocaleDateString()}` : ""}

Thank you for your business!
    `.trim();

    return Buffer.from(invoiceText, "utf-8");
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return null;
  }
}

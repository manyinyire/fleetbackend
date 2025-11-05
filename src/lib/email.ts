import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    // Validate configuration
    if (!config.auth.user || !config.auth.pass) {
      console.warn('SMTP configuration incomplete. Email service will not work.');
      return;
    }

    this.config = config;
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Check SMTP configuration.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Fleet Manager'}" <${this.config?.auth.user}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string, userName: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Fleet Manager!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${userName}!</h2>
            
            <p>Thank you for signing up for Fleet Manager. To complete your registration and start managing your fleet, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="color: #6c757d; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              This verification link will expire in 24 hours. If you didn't create an account with Fleet Manager, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - Fleet Manager',
      html,
    });
  }

  async sendOTPEmail(email: string, otp: string, userName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Two-Factor Authentication Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Two-Factor Authentication</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${userName}!</h2>
            
            <p>You requested a two-factor authentication code for your Fleet Manager account. Use the code below to complete your login:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #fff; border: 2px solid #28a745; border-radius: 10px; padding: 20px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 5px;">${otp}</span>
              </div>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please secure your account immediately.
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              For security reasons, never share this code with anyone. Fleet Manager will never ask for your authentication code.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Two-Factor Authentication Code - Fleet Manager',
      html,
    });
  }

  async sendInvoiceEmail(
    email: string, 
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      companyName: string;
      userName: string;
    },
    invoicePdf: Buffer
  ): Promise<boolean> {
    const { getPlatformSettingsWithDefaults } = await import('@/lib/platform-settings');
    const platformSettings = await getPlatformSettingsWithDefaults();
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${platformSettings.platformName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Invoice from ${platformSettings.platformName}</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${invoiceData.userName}!</h2>
            
            <p>Thank you for using ${platformSettings.platformName}! Please find your invoice attached below:</p>
            
            <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
              <p><strong>Amount:</strong> $${invoiceData.amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
              <p><strong>Company:</strong> ${invoiceData.companyName}</p>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">
              The invoice PDF is attached to this email. Please keep this for your records.
            </p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              If you have any questions about this invoice, please contact our support team${platformSettings.platformEmail ? ` at ${platformSettings.platformEmail}` : ''}.
            </p>
            ${platformSettings.platformUrl ? `<p style="color: #6c757d; font-size: 14px; margin-top: 10px;">
              Visit us at: <a href="${platformSettings.platformUrl}" style="color: #6f42c1;">${platformSettings.platformUrl}</a>
            </p>` : ''}
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Invoice ${invoiceData.invoiceNumber} - ${platformSettings.platformName}`,
      html,
      attachments: [{
        filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      }],
    });
  }

  async sendInvoiceReminderEmail(
    email: string,
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      companyName: string;
      userName: string;
    },
    invoicePdf: Buffer
  ): Promise<boolean> {
    const { getPlatformSettingsWithDefaults } = await import('@/lib/platform-settings');
    const platformSettings = await getPlatformSettingsWithDefaults();
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice Reminder - ${platformSettings.platformName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fd7e14 0%, #ffc107 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Invoice Reminder</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${invoiceData.userName}!</h2>
            
            <p>This is a friendly reminder that your ${platformSettings.platformName} subscription invoice is due soon:</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Payment Due Soon</h3>
              <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
              <p><strong>Amount:</strong> $${invoiceData.amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
              <p><strong>Company:</strong> ${invoiceData.companyName}</p>
            </div>
            
            <p>Please ensure payment is made before the due date to avoid any service interruption. The invoice PDF is attached for your convenience.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${platformSettings.platformUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/billing" 
                 style="background: #fd7e14; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Billing Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              If you have already made payment, please ignore this reminder. For any billing questions, contact our support team${platformSettings.platformEmail ? ` at ${platformSettings.platformEmail}` : ''}.
            </p>
            ${platformSettings.platformUrl ? `<p style="color: #6c757d; font-size: 14px; margin-top: 10px;">
              Visit us at: <a href="${platformSettings.platformUrl}" style="color: #fd7e14;">${platformSettings.platformUrl}</a>
            </p>` : ''}
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Invoice Reminder - ${invoiceData.invoiceNumber} Due Soon`,
      html,
      attachments: [{
        filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      }],
    });
  }

  async sendPaymentConfirmationEmail(
    email: string,
    tenantName: string,
    invoiceNumber: string,
    amount: string,
    paynowReference: string,
    invoicePdf?: Buffer
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation - Fleet Manager</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${tenantName}!</h2>
            
            <p>We have successfully received your payment. Thank you for your business!</p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">✅ Payment Details</h3>
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Amount Paid:</strong> $${amount}</p>
              <p><strong>Payment Reference:</strong> ${paynowReference}</p>
            </div>
            
            ${invoicePdf ? '<p style="color: #6c757d; font-size: 14px;">Your invoice PDF is attached to this email for your records.</p>' : ''}
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              If you have any questions about this payment, please contact our support team.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Payment Confirmed - Invoice ${invoiceNumber}`,
      html,
      attachments: invoicePdf ? [{
        filename: `invoice-${invoiceNumber}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      }] : undefined,
    });
  }

  async sendAdminPaymentAlert(
    tenantName: string,
    invoiceNumber: string,
    amount: string,
    paynowReference: string
  ): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';
    
    if (!adminEmail) {
      console.warn('Admin email not configured. Skipping admin alert.');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Payment Received - Fleet Manager</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Payment Received</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Payment Alert</h2>
            
            <p>A new payment has been received:</p>
            
            <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Payment Details</h3>
              <p><strong>Tenant:</strong> ${tenantName}</p>
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Payment Reference:</strong> ${paynowReference}</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              This is an automated notification from Fleet Manager.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `New Payment: ${invoiceNumber} - ${tenantName}`,
      html,
    });
  }
}

// Export standalone functions for backward compatibility
export async function generateInvoicePdf(invoiceId: string): Promise<Buffer | null> {
  try {
    const { invoiceGenerator } = await import('./invoice-generator');
    const { prisma } = await import('./prisma');
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          include: { settings: true }
        }
      }
    });

    if (!invoice) {
      console.error('Invoice not found:', invoiceId);
      return null;
    }

    const { pdf } = await invoiceGenerator.generateInvoice({
      tenantId: invoice.tenantId,
      type: invoice.type,
      plan: invoice.plan,
      amount: Number(invoice.amount),
      description: invoice.description || '',
      billingPeriod: invoice.billingPeriod || undefined,
    });

    return pdf;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return null;
  }
}

export async function sendPaymentConfirmationEmail(
  email: string,
  tenantName: string,
  invoiceNumber: string,
  amount: string,
  paynowReference: string,
  invoicePdf?: Buffer
): Promise<boolean> {
  return emailService.sendPaymentConfirmationEmail(
    email,
    tenantName,
    invoiceNumber,
    amount,
    paynowReference,
    invoicePdf
  );
}

export async function sendAdminPaymentAlert(
  tenantName: string,
  invoiceNumber: string,
  amount: string,
  paynowReference: string
): Promise<boolean> {
  return emailService.sendAdminPaymentAlert(
    tenantName,
    invoiceNumber,
    amount,
    paynowReference
  );
}

export const emailService = new EmailService();
export default emailService;
import nodemailer from 'nodemailer';
import logger from './logger';
import { EmailType } from '@prisma/client';
import { emailTemplateService } from './email-template-service';

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
      logger.warn('SMTP configuration incomplete. Email service will not work.');
      return;
    }

    this.config = config;
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email service not initialized. Check SMTP configuration.');
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
      logger.info({ messageId: result.messageId, to: options.to, subject: options.subject }, 'Email sent successfully');
      return true;
    } catch (error) {
      logger.error({ err: error, to: options.to, subject: options.subject }, 'Failed to send email');
      return false;
    }
  }

  /**
   * Send email using database template
   */
  async sendTemplatedEmail(
    to: string | string[],
    templateType: EmailType,
    variables: Record<string, any>,
    templateName?: string
  ): Promise<boolean> {
    try {
      const rendered = await emailTemplateService.getRenderedEmail(
        templateType,
        variables,
        templateName
      );

      if (!rendered) {
        logger.error({ templateType, templateName }, 'Email template not found');
        return false;
      }

      return this.sendEmail({
        to,
        subject: rendered.subject,
        html: rendered.html
      });
    } catch (error) {
      logger.error({ err: error, templateType, templateName }, 'Failed to send templated email');
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string, userName: string): Promise<boolean> {
    // Use appConfig to get the proper base URL with validation
    const { appConfig } = await import('@/config/app');
    const verificationUrl = `${appConfig.baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    
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

  async sendWelcomeEmail(email: string, userName: string, planName: string = 'FREE'): Promise<boolean> {
    const { appConfig } = await import('@/config/app');
    const dashboardUrl = `${appConfig.baseUrl}/dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Fleet Manager!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Fleet Manager!</h1>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${userName}!</h2>

            <p>Thank you for verifying your email! Your Fleet Manager account is now fully activated and ready to use.</p>

            <p>You're currently on the <strong>${planName}</strong> plan. Here's what you can do next:</p>

            <ul style="color: #495057; line-height: 1.8;">
              <li>Set up your fleet and add vehicles</li>
              <li>Create driver profiles and assignments</li>
              <li>Track maintenance schedules</li>
              <li>Monitor fuel consumption and costs</li>
              <li>Generate comprehensive reports</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">

            <h3 style="color: #495057; font-size: 16px;">Need Help Getting Started?</h3>
            <p style="color: #6c757d; font-size: 14px;">
              Check out our documentation or contact our support team. We're here to help you make the most of Fleet Manager!
            </p>

            <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
              Best regards,<br/>
              The Fleet Manager Team
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Fleet Manager - Get Started!',
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
    const { appConfig } = await import('@/config/app');
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
              <a href="${platformSettings.platformUrl || appConfig.baseUrl}/billing"
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
      logger.warn('Admin email not configured. Skipping admin payment alert.');
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

  async sendAdminNewRegistrationAlert(
    tenantName: string,
    userName: string,
    userEmail: string,
    plan: string = 'FREE'
  ): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';

    if (!adminEmail) {
      logger.warn('Admin email not configured. Skipping admin registration alert.');
      return false;
    }

    const { appConfig } = await import('@/config/app');
    const superadminUrl = `${appConfig.baseUrl}/superadmin/tenants`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Registration - Fleet Manager</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New Registration!</h1>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">New User Verified</h2>

            <p>A new user has successfully registered and verified their email:</p>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Registration Details</h3>
              <p><strong>Company/Tenant:</strong> ${tenantName}</p>
              <p><strong>Admin User:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Plan:</strong> ${plan}</p>
              <p><strong>Status:</strong> <span style="color: #28a745;">✓ Email Verified</span></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${superadminUrl}"
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View in Dashboard
              </a>
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
      subject: `New Registration: ${tenantName} (${userName})`,
      html,
    });
  }

  async sendAdminUpgradeAlert(
    tenantName: string,
    userName: string,
    userEmail: string,
    oldPlan: string,
    newPlan: string,
    amount: string
  ): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';

    if (!adminEmail) {
      logger.warn('Admin email not configured. Skipping admin upgrade alert.');
      return false;
    }

    const { appConfig } = await import('@/config/app');
    const superadminUrl = `${appConfig.baseUrl}/superadmin/tenants`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Plan Upgrade - Fleet Manager</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⬆️ Plan Upgrade!</h1>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Plan Upgrade Alert</h2>

            <p>A tenant has upgraded their subscription plan:</p>

            <div style="background: #e7d6f5; border: 1px solid #d4b3e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #6f42c1; margin-top: 0;">Upgrade Details</h3>
              <p><strong>Company/Tenant:</strong> ${tenantName}</p>
              <p><strong>Admin User:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Previous Plan:</strong> <span style="color: #6c757d;">${oldPlan}</span></p>
              <p><strong>New Plan:</strong> <span style="color: #6f42c1; font-weight: bold;">${newPlan}</span></p>
              <p><strong>Upgrade Amount:</strong> $${amount}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${superadminUrl}"
                 style="background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View in Dashboard
              </a>
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
      subject: `Plan Upgrade: ${tenantName} upgraded to ${newPlan}`,
      html,
    });
  }

  async sendAccountSuspendedEmail(
    email: string,
    data: {
      tenantName: string;
      userName: string;
      reason: string;
      suspendedDate: string;
      renewalUrl: string;
      supportEmail?: string;
    }
  ): Promise<boolean> {
    const { getPlatformSettingsWithDefaults } = await import('@/lib/platform-settings');
    const platformSettings = await getPlatformSettingsWithDefaults();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Account Suspended - ${platformSettings.platformName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Account Suspended</h1>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${data.userName}!</h2>

            <p>We're writing to inform you that your ${platformSettings.platformName} account has been suspended.</p>

            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #721c24; margin-top: 0;">Suspension Details</h3>
              <p><strong>Company/Tenant:</strong> ${data.tenantName}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
              <p><strong>Suspended Date:</strong> ${data.suspendedDate}</p>
            </div>

            <h3 style="color: #495057; font-size: 18px;">What This Means:</h3>
            <ul style="color: #495057; line-height: 1.8;">
              <li>Your account access has been temporarily disabled</li>
              <li>All users under your account cannot log in</li>
              <li>Your data remains safe and secure</li>
              <li>No data will be deleted during suspension</li>
            </ul>

            <h3 style="color: #495057; font-size: 18px;">How to Restore Access:</h3>
            <p>To reactivate your account, please renew your subscription:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.renewalUrl}"
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Renew Subscription
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">

            <p style="color: #6c757d; font-size: 14px;">
              If you have any questions or believe this suspension was made in error, please contact our support team${data.supportEmail ? ` at ${data.supportEmail}` : ''}.
            </p>

            <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
              Best regards,<br/>
              The ${platformSettings.platformName} Team
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Account Suspended - ${data.reason}`,
      html,
    });
  }

  async sendInvoiceNotificationEmail(
    email: string,
    data: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      companyName: string;
      userName: string;
      plan: string;
      paymentUrl: string;
    },
    invoicePdf?: Buffer
  ): Promise<boolean> {
    const { getPlatformSettingsWithDefaults } = await import('@/lib/platform-settings');
    const platformSettings = await getPlatformSettingsWithDefaults();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Invoice - ${platformSettings.platformName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Invoice Available</h1>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${data.userName}!</h2>

            <p>A new invoice has been generated for your ${data.plan} plan subscription.</p>

            <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #004085; margin-top: 0;">Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
              <p><strong>Company:</strong> ${data.companyName}</p>
              <p><strong>Plan:</strong> ${data.plan}</p>
              <p><strong>Amount Due:</strong> $${data.amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>

            <p>Please make payment before the due date to avoid service interruption.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.paymentUrl}"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Pay Invoice Now
              </a>
            </div>

            ${invoicePdf ? '<p style="color: #6c757d; font-size: 14px;">The invoice PDF is attached to this email for your records.</p>' : ''}

            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">

            <p style="color: #6c757d; font-size: 14px;">
              If you have any questions about this invoice, please contact our support team${platformSettings.platformEmail ? ` at ${platformSettings.platformEmail}` : ''}.
            </p>

            <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
              Thank you for using ${platformSettings.platformName}!
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `New Invoice ${data.invoiceNumber} - Payment Due ${data.dueDate}`,
      html,
      attachments: invoicePdf ? [{
        filename: `invoice-${data.invoiceNumber}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf',
      }] : undefined,
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
      logger.error({ invoiceId }, 'Invoice not found');
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
    logger.error({ err: error, invoiceId }, 'Error generating invoice PDF');
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
/**
 * Seed Email Templates
 * 
 * This script migrates hardcoded email templates to the database
 * Run with: npx tsx scripts/seed-email-templates.ts
 */

import { PrismaClient, EmailType } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'Email Verification',
    type: EmailType.WELCOME,
    subject: 'Verify Your Email Address - Fleet Manager',
    body: `<!DOCTYPE html>
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
      <h2 style="color: #495057; margin-top: 0;">Hi {{userName}}!</h2>
      
      <p>Thank you for signing up for Fleet Manager. To complete your registration and start managing your fleet, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verificationUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      
      <p style="color: #6c757d; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #667eea; word-break: break-all; font-size: 14px;">{{verificationUrl}}</p>
      
      <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
      
      <p style="color: #6c757d; font-size: 12px; margin: 0;">This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </body>
</html>`,
    variables: {
      userName: 'User name',
      verificationUrl: 'Email verification URL'
    },
    isActive: true
  },
  {
    name: 'Password Reset',
    type: EmailType.PASSWORD_RESET,
    subject: 'Password Reset - Fleet Manager',
    body: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Password Reset</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin-top: 0;">Hi {{userName}}!</h2>
      
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      
      <p style="color: #6c757d; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #667eea; word-break: break-all; font-size: 14px;">{{resetUrl}}</p>
      
      <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
      
      <p style="color: #6c757d; font-size: 12px; margin: 0;">This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  </body>
</html>`,
    variables: {
      userName: 'User name',
      resetUrl: 'Password reset URL'
    },
    isActive: true
  },
  {
    name: 'Invoice Notification',
    type: EmailType.INVOICE_NOTIFICATION,
    subject: 'Invoice {{invoiceNumber}} - {{platformName}}',
    body: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invoice</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">New Invoice</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin-top: 0;">Invoice {{invoiceNumber}}</h2>
      
      <p>Dear {{tenantName}},</p>
      <p>A new invoice has been generated for your account.</p>
      
      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Invoice Number:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{invoiceNumber}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Amount:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">$\{{amount}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Due Date:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{dueDate}}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Status:</strong></td>
            <td style="padding: 10px; text-align: right;"><span style="background: #ffc107; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">{{status}}</span></td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{paymentUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Pay Now</a>
      </div>
      
      <p style="color: #6c757d; font-size: 14px;">You can also view and download your invoice from your dashboard.</p>
    </div>
  </body>
</html>`,
    variables: {
      tenantName: 'Tenant name',
      invoiceNumber: 'Invoice number',
      amount: 'Invoice amount',
      dueDate: 'Due date',
      status: 'Invoice status',
      paymentUrl: 'Payment URL',
      platformName: 'Platform name'
    },
    isActive: true
  },
  {
    name: 'Payment Confirmation',
    type: EmailType.INVOICE_NOTIFICATION,
    subject: 'Payment Confirmed - Invoice {{invoiceNumber}}',
    body: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Payment Confirmed</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">✓ Payment Confirmed</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin-top: 0;">Thank you for your payment!</h2>
      
      <p>Dear {{tenantName}},</p>
      <p>We have successfully received your payment for invoice {{invoiceNumber}}.</p>
      
      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Invoice Number:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{invoiceNumber}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Amount Paid:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">$\{{amount}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Payment Date:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{paymentDate}}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Payment Method:</strong></td>
            <td style="padding: 10px; text-align: right;">{{paymentMethod}}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #6c757d; font-size: 14px;">A receipt has been attached to this email for your records.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Dashboard</a>
      </div>
    </div>
  </body>
</html>`,
    variables: {
      tenantName: 'Tenant name',
      invoiceNumber: 'Invoice number',
      amount: 'Payment amount',
      paymentDate: 'Payment date',
      paymentMethod: 'Payment method',
      dashboardUrl: 'Dashboard URL'
    },
    isActive: true
  },
  {
    name: 'Account Suspended',
    type: EmailType.ACCOUNT_SUSPENDED,
    subject: 'Account Suspended - {{reason}}',
    body: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Account Suspended</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Account Suspended</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin-top: 0;">Important Notice</h2>
      
      <p>Dear {{tenantName}},</p>
      <p>Your account has been temporarily suspended.</p>
      
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> {{reason}}</p>
      </div>
      
      <p>{{message}}</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{contactUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Contact Support</a>
      </div>
      
      <p style="color: #6c757d; font-size: 14px;">If you believe this is an error, please contact our support team immediately.</p>
    </div>
  </body>
</html>`,
    variables: {
      tenantName: 'Tenant name',
      reason: 'Suspension reason',
      message: 'Detailed message',
      contactUrl: 'Support contact URL'
    },
    isActive: true
  },
  {
    name: 'Admin New Registration',
    type: EmailType.ADMIN_NOTIFICATION,
    subject: 'New Registration: {{tenantName}} ({{userName}})',
    body: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>New Registration</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Registration</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
      <h2 style="color: #495057; margin-top: 0;">New Tenant Registered</h2>
      
      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Tenant Name:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{tenantName}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>User Name:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{userName}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Email:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{userEmail}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Plan:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">{{plan}}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Registration Date:</strong></td>
            <td style="padding: 10px; text-align: right;">{{registrationDate}}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{tenantUrl}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Tenant Details</a>
      </div>
    </div>
  </body>
</html>`,
    variables: {
      tenantName: 'Tenant name',
      userName: 'User name',
      userEmail: 'User email',
      plan: 'Subscription plan',
      registrationDate: 'Registration date',
      tenantUrl: 'Tenant details URL'
    },
    isActive: true
  }
];

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  try {
    for (const template of emailTemplates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name }
      });

      if (existing) {
        console.log(`✓ Template "${template.name}" already exists, updating...`);
        await prisma.emailTemplate.update({
          where: { name: template.name },
          data: template
        });
      } else {
        console.log(`+ Creating template "${template.name}"...`);
        await prisma.emailTemplate.create({
          data: template
        });
      }
    }

    console.log('\n✅ Email templates seeded successfully!');
    console.log(`📧 Total templates: ${emailTemplates.length}`);
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEmailTemplates();

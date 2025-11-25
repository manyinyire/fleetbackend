import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Default email templates
const DEFAULT_TEMPLATES = [
  {
    slug: 'welcome-email',
    name: 'Welcome Email',
    description: 'Sent to new users when they sign up',
    subject: 'Welcome to {{platformName}}!',
    body: `
      <h1>Welcome to {{platformName}}, {{userName}}!</h1>
      <p>Thank you for signing up. We're excited to have you on board.</p>
      <p>Here are your account details:</p>
      <ul>
        <li>Email: {{userEmail}}</li>
        <li>Account Type: {{accountType}}</li>
      </ul>
      <p>To get started, please visit your dashboard:</p>
      <a href="{{dashboardUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
    `,
    variables: ['platformName', 'userName', 'userEmail', 'accountType', 'dashboardUrl'],
    isActive: true,
    category: 'USER',
  },
  {
    slug: 'password-reset',
    name: 'Password Reset',
    description: 'Sent when a user requests a password reset',
    subject: 'Reset Your Password',
    body: `
      <h1>Password Reset Request</h1>
      <p>Hi {{userName}},</p>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      <a href="{{resetUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      <p>This link will expire in {{expiryHours}} hours.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    variables: ['userName', 'resetUrl', 'expiryHours'],
    isActive: true,
    category: 'AUTHENTICATION',
  },
  {
    slug: 'invoice-created',
    name: 'Invoice Created',
    description: 'Sent when a new invoice is created',
    subject: 'New Invoice #{{invoiceNumber}}',
    body: `
      <h1>New Invoice</h1>
      <p>Hi {{customerName}},</p>
      <p>A new invoice has been created for your account:</p>
      <ul>
        <li>Invoice Number: #{{invoiceNumber}}</li>
        <li>Amount: {{amount}}</li>
        <li>Due Date: {{dueDate}}</li>
      </ul>
      <a href="{{invoiceUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice</a>
    `,
    variables: ['customerName', 'invoiceNumber', 'amount', 'dueDate', 'invoiceUrl'],
    isActive: true,
    category: 'BILLING',
  },
  {
    slug: 'payment-successful',
    name: 'Payment Successful',
    description: 'Sent when a payment is successfully processed',
    subject: 'Payment Confirmed',
    body: `
      <h1>Payment Successful</h1>
      <p>Hi {{customerName}},</p>
      <p>Thank you! Your payment has been processed successfully.</p>
      <ul>
        <li>Amount Paid: {{amount}}</li>
        <li>Payment Method: {{paymentMethod}}</li>
        <li>Transaction ID: {{transactionId}}</li>
        <li>Date: {{paymentDate}}</li>
      </ul>
      <a href="{{receiptUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Receipt</a>
    `,
    variables: ['customerName', 'amount', 'paymentMethod', 'transactionId', 'paymentDate', 'receiptUrl'],
    isActive: true,
    category: 'BILLING',
  },
  {
    slug: 'subscription-expiring',
    name: 'Subscription Expiring',
    description: 'Sent before a subscription expires',
    subject: 'Your Subscription is Expiring Soon',
    body: `
      <h1>Subscription Expiring</h1>
      <p>Hi {{customerName}},</p>
      <p>Your subscription to {{planName}} will expire on {{expiryDate}}.</p>
      <p>To continue enjoying our services, please renew your subscription:</p>
      <a href="{{renewUrl}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Renew Now</a>
    `,
    variables: ['customerName', 'planName', 'expiryDate', 'renewUrl'],
    isActive: true,
    category: 'SUBSCRIPTION',
  },
];

export async function GET(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: any = {};

    if (category) {
      where.type = category as any; // category maps to type in schema
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get templates from database
    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: {
        type: 'asc',
      },
    });

    // Get statistics
    const stats = {
      total: await prisma.emailTemplate.count(),
      active: await prisma.emailTemplate.count({ where: { isActive: true } }),
      inactive: await prisma.emailTemplate.count({ where: { isActive: false } }),
      byCategory: await prisma.emailTemplate.groupBy({
        by: ['type'],
        _count: true,
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        templates,
        stats,
      },
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Email templates fetch error:');
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('SUPER_ADMIN');
    const data = await request.json();

    // Validate required fields
    if (!data.slug || !data.name || !data.subject || !data.body) {
      return NextResponse.json(
        { success: false, error: 'Slug, name, subject, and body are required' },
        { status: 400 }
      );
    }

    // Check if name already exists (name is unique)
    if (!data.id) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Template with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Create or update template
    const template = await prisma.emailTemplate.upsert({
      where: {
        id: data.id || 'new',
      },
      update: {
        name: data.name,
        type: data.type || data.category || 'WELCOME',
        subject: data.subject,
        body: data.body,
        variables: data.variables || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      create: {
        name: data.name,
        type: data.type || data.category || 'WELCOME',
        subject: data.subject,
        body: data.body,
        variables: data.variables || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: data.id ? 'EMAIL_TEMPLATE_UPDATED' : 'EMAIL_TEMPLATE_CREATED',
        entityType: 'EmailTemplate',
        entityId: template.id,
        newValues: {
          name: template.name,
          type: template.type,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Email template save error:');
    return NextResponse.json(
      { success: false, error: 'Failed to save email template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole('SUPER_ADMIN');

    // Seed default templates
    const created = [];
    for (const template of DEFAULT_TEMPLATES) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name },
      });

      if (!existing) {
        const newTemplate = await prisma.emailTemplate.create({
          data: {
            name: template.name,
            type: (template as any).type || (template as any).category || 'WELCOME',
            subject: template.subject,
            body: template.body,
            variables: template.variables,
            isActive: template.isActive !== undefined ? template.isActive : true,
          },
        });
        created.push(newTemplate);
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_TEMPLATES_SEEDED',
        entityType: 'EmailTemplate',
        entityId: 'bulk',
        newValues: {
          count: created.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Seeded ${created.length} default templates`,
      data: created,
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Email templates seed error:');
    return NextResponse.json(
      { success: false, error: 'Failed to seed email templates' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole('SUPER_ADMIN');
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.delete({
      where: { id: templateId },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_TEMPLATE_DELETED',
        entityType: 'EmailTemplate',
        entityId: templateId,
        oldValues: {
          name: template.name,
          type: template.type,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Email template deletion error:');
    return NextResponse.json(
      { success: false, error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}

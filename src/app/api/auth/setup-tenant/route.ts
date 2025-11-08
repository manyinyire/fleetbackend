import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { authLogger } from '@/lib/logger';

// Generate unique slug for tenant
async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has a tenant
    if ((user as any).tenantId) {
      return NextResponse.json(
        { error: 'User already has a tenant' },
        { status: 400 }
      );
    }

    // Check if user is SUPER_ADMIN (they shouldn't need a tenant)
    if ((user as any).role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super admin users do not need a tenant' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { companyName, phone } = body;

    if (!companyName || !phone) {
      return NextResponse.json(
        { error: 'Company name and phone are required' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(companyName);

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        email: user.email,
        phone,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });

    authLogger.info({
      userId: user.id,
      tenantId: tenant.id,
      companyName,
    }, 'Tenant created for user');

    // Create tenant settings with defaults
    await prisma.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        companyName,
        email: user.email,
        phone,
        currency: 'USD',
        timezone: 'Africa/Harare',
        country: 'Zimbabwe',
        primaryColor: '#1e3a8a',
        invoicePrefix: 'INV',
        dateFormat: 'YYYY-MM-DD',
      },
    });

    // Update user with tenantId and set role to TENANT_ADMIN
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tenantId: tenant.id,
        role: 'TENANT_ADMIN',
      },
    });

    authLogger.info({
      userId: user.id,
      tenantId: tenant.id,
    }, 'User updated with tenant');

    // Generate and send free plan invoice (don't fail if this errors)
    try {
      const { invoiceGenerator } = await import('@/lib/invoice-generator');
      const { emailService } = await import('@/lib/email');

      const { invoice, pdf } = await invoiceGenerator.createFreePlanInvoice(tenant.id);

      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        dueDate: invoice.dueDate.toLocaleDateString(),
        companyName: tenant.name,
        userName: user.name || 'User'
      };

      await emailService.sendInvoiceEmail(user.email, invoiceData, pdf);
    } catch (invoiceError) {
      authLogger.error({ err: invoiceError }, 'Failed to generate invoice');
      // Don't fail the request if invoice generation fails
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });
  } catch (error: any) {
    authLogger.error({ err: error }, 'Tenant setup error');
    return NextResponse.json(
      { error: error.message || 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

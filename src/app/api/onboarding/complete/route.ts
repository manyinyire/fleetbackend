import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    await setTenantContext(tenantId);
    
    // Get scoped Prisma client
    const prisma = getTenantPrisma(tenantId);

    // Update tenant settings to mark onboarding as complete
    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        companyName: 'Fleet Company', // This should be updated with actual data
        email: user.email,
        phone: '+263 77 123 4567', // This should be updated with actual data
      },
      update: {
        // Add any onboarding completion flags here
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
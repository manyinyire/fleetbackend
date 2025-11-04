import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!(user as any)?.tenantId) {
      return NextResponse.json(
        { error: 'No tenant context' },
        { status: 403 }
      );
    }

    // Fetch tenant name directly from Tenant model
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: (user as any).tenantId as string,
      },
      select: {
        name: true,
      },
    });

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: {
        tenantId: (user as any).tenantId as string,
      },
      select: {
        companyName: true,
        logoUrl: true,
        primaryColor: true,
      },
    });

    // Return tenant name (prefer settings companyName, fallback to tenant name)
    return NextResponse.json({
      companyName: tenantSettings?.companyName || tenant?.name || 'Azaire Fleet Manager',
      tenantName: tenant?.name || tenantSettings?.companyName || 'Azaire Fleet Manager',
      logoUrl: tenantSettings?.logoUrl,
      primaryColor: tenantSettings?.primaryColor,
    });
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    if (!tenantSettings) {
      return NextResponse.json(
        { error: 'Tenant settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tenantSettings);
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

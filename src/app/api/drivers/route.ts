import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    await setTenantContext(tenantId);
    
    // Get scoped Prisma client
    const prisma = getTenantPrisma(tenantId);

    const drivers = await prisma.driver.findMany({
      include: {
        vehicles: {
          include: {
            vehicle: true
          }
        },
        remittances: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Drivers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    const data = await request.json();
    
    // Set RLS context
    await setTenantContext(tenantId);
    
    // Get scoped Prisma client
    const prisma = getTenantPrisma(tenantId);

    const driver = await prisma.driver.create({
      data: {
        fullName: data.fullName,
        nationalId: data.nationalId,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        phone: data.phone,
        email: data.email,
        paymentModel: data.paymentModel,
        paymentConfig: data.paymentConfig || {},
        debtBalance: 0,
        status: 'ACTIVE',
      }
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Driver creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    );
  }
}
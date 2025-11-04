import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { PremiumFeatureService } from '@/lib/premium-features';

export async function GET(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }

    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

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
      orderBy: { createdAt: 'desc' },
      where: {
        tenantId: tenantId
      }
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

    // Check if tenant can add more drivers (premium feature check)
    const featureCheck = await PremiumFeatureService.canAddDriver(tenantId);

    if (!featureCheck.allowed) {
      return NextResponse.json(
        {
          error: featureCheck.reason,
          currentUsage: featureCheck.currentUsage,
          limit: featureCheck.limit,
          suggestedPlan: featureCheck.suggestedPlan,
          upgradeMessage: featureCheck.upgradeMessage,
        },
        { status: 403 }
      );
    }

    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }

    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    const driver = await prisma.driver.create({
      data: {
        tenantId,
        fullName: data.fullName,
        nationalId: data.nationalId,
        licenseNumber: data.licenseNumber,
        phone: data.phone,
        email: data.email || null,
        homeAddress: data.homeAddress || '',
        nextOfKin: data.nextOfKin || '',
        nextOfKinPhone: data.nextOfKinPhone || '',
        // Payment configuration is now on Vehicle - drivers inherit it when assigned
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
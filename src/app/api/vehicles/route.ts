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

    const vehicles = await prisma.vehicle.findMany({
      include: {
        drivers: {
          include: {
            driver: true
          }
        },
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      where: {
        tenantId: tenantId
      }
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    const data = await request.json();

    // Check if tenant can add more vehicles (premium feature check)
    const featureCheck = await PremiumFeatureService.canAddVehicle(tenantId);

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

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: data.registrationNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        type: data.type,
        initialCost: data.initialCost,
        currentMileage: data.currentMileage || 0,
        status: data.status || 'ACTIVE',
        paymentModel: data.paymentModel,
        paymentConfig: data.paymentConfig,
      }
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    return createErrorResponse(error);
  }
}
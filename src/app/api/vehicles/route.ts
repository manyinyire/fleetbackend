import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantAuth, TenantApiContext, successResponse, getPaginationFromRequest, validateBody } from '@/lib/api-middleware';
import { PremiumFeatureService } from '@/lib/premium-features';
import { VehicleType, VehicleStatus, PaymentModel } from '@prisma/client';

// Validation schema for creating a vehicle
import { createVehicleSchema } from '@/lib/schemas/vehicle';

/**
 * GET /api/vehicles
 * List all vehicles with filtering and pagination
 */
export const GET = withTenantAuth(async ({ services, request }: TenantApiContext) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { searchParams } = new URL(request.url);

  const filters = {
    type: (searchParams.get('type') as VehicleType) || undefined,
    status: (searchParams.get('status') as VehicleStatus) || undefined,
    search: searchParams.get('search') || undefined,
    page,
    limit,
  };

  // Use VehicleService for business logic
  const result = await services.vehicles.findAll(filters);

  return successResponse(result);
});

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
export const POST = withTenantAuth(async ({ services, tenantId, user, request }: TenantApiContext) => {
  // Validate request body
  const data = await validateBody(request, createVehicleSchema);
  
  // Ensure paymentConfig is set (required by CreateVehicleDTO)
  if (!data.paymentConfig) {
    data.paymentConfig = {};
  }

  // Check premium feature limit
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

  // Use VehicleService for creation
  const vehicle = await services.vehicles.create(data as any, user.id);

  return successResponse(vehicle, 201);
});

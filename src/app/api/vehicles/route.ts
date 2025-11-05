import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantAuth, ApiContext, successResponse, getPaginationFromRequest, validateBody } from '@/lib/api-middleware';
import { PremiumFeatureService } from '@/lib/premium-features';
import { VehicleType, VehicleStatus, PaymentModel } from '@prisma/client';

// Validation schema for creating a vehicle
const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: z.enum(['SEDAN', 'SUV', 'TRUCK', 'VAN', 'BUS', 'OMNIBUS', 'OTHER']),
  initialCost: z.number().positive('Initial cost must be positive'),
  currentMileage: z.number().nonnegative().optional().default(0),
  status: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']).optional().default('ACTIVE'),
  paymentModel: z.enum(['DAILY', 'WEEKLY', 'PERCENTAGE', 'FIXED_RATE']),
  paymentConfig: z.any(),
});

/**
 * GET /api/vehicles
 * List all vehicles with filtering and pagination
 */
export const GET = withTenantAuth(async ({ services, request }: ApiContext) => {
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
export const POST = withTenantAuth(async ({ services, tenantId, user, request }: ApiContext) => {
  // Validate request body
  const data = await validateBody(request, createVehicleSchema);

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
  const vehicle = await services.vehicles.create(data, user.id);

  return successResponse(vehicle, 201);
});

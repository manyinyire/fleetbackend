import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantAuth, TenantApiContext, successResponse, paginationResponse, getPaginationFromRequest, validateBody } from '@/lib/api-middleware';
import { PremiumFeatureService } from '@/lib/premium-features';
import { DriverStatus } from '@prisma/client';

// Validation schema for creating a driver
const createDriverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nationalId: z.string().min(1, 'National ID is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().nullable(),
  homeAddress: z.string().optional().default(''),
  nextOfKin: z.string().optional().default(''),
  nextOfKinPhone: z.string().optional().default(''),
  hasDefensiveLicense: z.boolean().optional().default(false),
  defensiveLicenseNumber: z.string().optional(),
  defensiveLicenseExpiry: z.string().optional(),
});

/**
 * GET /api/drivers
 * List all drivers with filtering and pagination
 */
export const GET = withTenantAuth(async ({ services, request }: TenantApiContext) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { searchParams } = new URL(request.url);

  const filters = {
    status: (searchParams.get('status') as DriverStatus) || undefined,
    search: searchParams.get('search') || undefined,
    hasDefensiveLicense: searchParams.get('hasDefensiveLicense') === 'true' ? true : undefined,
    page,
    limit,
  };

  // Use DriverService for business logic
  const result = await services.drivers.findAll(filters);

  return successResponse(result);
});

/**
 * POST /api/drivers
 * Create a new driver
 */
export const POST = withTenantAuth(async ({ services, tenantId, user, request }: TenantApiContext) => {
  // Validate request body
  const data = await validateBody(request, createDriverSchema);

  // Check premium feature limit
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

  // Transform data for service
  const driverData = {
    ...data,
    email: data.email || undefined, // Convert null to undefined
    defensiveLicenseExpiry: data.defensiveLicenseExpiry
      ? new Date(data.defensiveLicenseExpiry)
      : undefined,
  };

  // Use DriverService for creation
  const driver = await services.drivers.create(driverData, user.id);

  return successResponse(driver, 201);
});

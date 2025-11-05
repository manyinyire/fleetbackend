import { NextRequest } from 'next/server';
import { withTenantAuth, ApiContext, successResponse, validateBody, getPaginationFromRequest, getDateRangeFromRequest } from '@/lib/api-middleware';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import { z } from 'zod';
import { MaintenanceType } from '@prisma/client';

// Validation schema for creating a maintenance record
const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  mileage: z.number().int().nonnegative('Mileage must be non-negative'),
  type: z.enum(['ROUTINE_SERVICE', 'REPAIR', 'TIRE_REPLACEMENT', 'BRAKE_SERVICE', 'ENGINE_REPAIR', 'BODY_WORK', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nonnegative('Cost must be non-negative'),
  provider: z.string().min(1, 'Provider is required'),
  invoice: z.string().url().optional().nullable(),
});

/**
 * GET /api/maintenance
 * List all maintenance records with filtering and pagination
 */
export const GET = withTenantAuth(async ({ services, request }: ApiContext) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { startDate, endDate } = getDateRangeFromRequest(request);
  const { searchParams } = new URL(request.url);

  const filters = {
    vehicleId: searchParams.get('vehicleId') || undefined,
    type: (searchParams.get('type') as MaintenanceType) || undefined,
    startDate,
    endDate,
    page,
    limit,
  };

  // Use MaintenanceService for business logic
  const result = await services.maintenance.findAll(filters);

  // Serialize Decimal objects to numbers
  const serialized = {
    records: serializePrismaResults(result.records),
    pagination: result.pagination,
  };

  return successResponse(serialized);
});

/**
 * POST /api/maintenance
 * Create a new maintenance record
 */
export const POST = withTenantAuth(async ({ services, user, request }: ApiContext) => {
  const data = await validateBody(request, createMaintenanceSchema);

  // Transform data for service
  const maintenanceData = {
    vehicleId: data.vehicleId,
    date: new Date(data.date),
    mileage: data.mileage,
    type: data.type as MaintenanceType,
    description: data.description,
    cost: data.cost,
    provider: data.provider,
    invoice: data.invoice || undefined,
  };

  // Use MaintenanceService for creation
  const maintenance = await services.maintenance.create(maintenanceData, user.id);

  return successResponse(serializePrismaResults(maintenance), 201);
});

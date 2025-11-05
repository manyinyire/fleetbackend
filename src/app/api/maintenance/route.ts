import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, validateBody, getPaginationFromRequest, getDateRangeFromRequest, paginationResponse } from '@/lib/api-middleware';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import { z } from 'zod';

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

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { startDate, endDate } = getDateRangeFromRequest(request);
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');
  const type = searchParams.get('type');

  // Build where clause
  const where: any = {
    tenantId: tenantId,
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  if (vehicleId) where.vehicleId = vehicleId;
  if (type) where.type = type;

  const [maintenanceRecords, total] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.maintenanceRecord.count({ where }),
  ]);

  // Convert Decimal objects to numbers
  const serialized = serializePrismaResults(maintenanceRecords);

  return successResponse(paginationResponse(serialized, total, page, limit));
});

export const POST = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const data = await validateBody(request, createMaintenanceSchema);

  // Verify vehicle exists and belongs to tenant
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: data.vehicleId,
      tenantId: tenantId,
    },
  });

  if (!vehicle) {
    return successResponse({ error: 'Vehicle not found' }, 404);
  }

  const maintenanceRecord = await prisma.maintenanceRecord.create({
    data: {
      tenantId,
      vehicleId: data.vehicleId,
      date: new Date(data.date),
      mileage: data.mileage,
      type: data.type,
      description: data.description,
      cost: data.cost,
      provider: data.provider,
      invoice: data.invoice || null,
    },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          make: true,
          model: true,
        },
      },
    },
  });

  return successResponse(serializePrismaResults(maintenanceRecord), 201);
});

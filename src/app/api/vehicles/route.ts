import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, withErrorHandler, parsePaginationParams, paginatedResponse, calculateSkip, buildOrderBy } from '@/lib/api';
import { createVehicleSchema } from '@/lib/validations/vehicle';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const { page = 1, limit = 25, sortBy, sortOrder = 'desc' } = parsePaginationParams(searchParams);
    const skip = calculateSkip(page, limit);

    // Build query
    const where = { tenantId: tenantId! };

    // Execute query with pagination
    const [vehicles, total] = await prisma.$transaction([
      prisma.vehicle.findMany({
        where,
        include: {
          drivers: {
            include: {
              driver: true,
            },
          },
          maintenanceRecords: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    logger.info({ tenantId, count: vehicles.length, total }, 'Fetched vehicles');

    return paginatedResponse(serializePrismaResults(vehicles), total, page, limit);
  }),
  'vehicles:GET'
);

export const POST = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createVehicleSchema.parse(body);

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId: tenantId!,
        registrationNumber: validatedData.registrationNumber,
        make: validatedData.make,
        model: validatedData.model,
        year: validatedData.year,
        type: validatedData.type,
        initialCost: validatedData.initialCost,
        currentMileage: 0,
        status: 'ACTIVE',
        paymentModel: validatedData.paymentModel || 'DRIVER_REMITS',
        paymentConfig: validatedData.paymentConfig || {},
      },
    });

    logger.info({ tenantId, vehicleId: vehicle.id }, 'Vehicle created');

    return NextResponse.json(serializePrismaResults(vehicle), { status: 201 });
  }),
  'vehicles:POST'
);

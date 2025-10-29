import { NextRequest, NextResponse } from 'next/server';
import { createGetHandler, createPostHandler } from '@/middleware/api-middleware';
import { getVehiclesSchema, createVehicleSchema } from '@/lib/api-schemas';
import { parsePaginationParams, createPaginatedResponse, getSkipValue, buildOrderBy } from '@/lib/pagination';

/**
 * GET /api/vehicles
 * List all vehicles for the current tenant with pagination and filtering
 */
export const GET = createGetHandler(
  {
    auth: 'required',
    requireTenant: true,
    validate: { query: getVehiclesSchema },
  },
  async (request, context) => {
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(
      context.searchParams!,
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    const search = context.searchParams?.get('search');
    const type = context.searchParams?.get('type');
    const status = context.searchParams?.get('status');

    // Build where clause
    const where: any = { tenantId: context.tenantId };

    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Fetch vehicles with pagination
    const [vehicles, totalCount] = await Promise.all([
      context.prisma.vehicle.findMany({
        where,
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
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip: getSkipValue(page, limit),
        take: limit,
      }),
      context.prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(vehicles, page, limit, totalCount)
    );
  }
);

/**
 * POST /api/vehicles
 * Create a new vehicle for the current tenant
 */
export const POST = createPostHandler(
  {
    auth: 'required',
    requireTenant: true,
    validate: { body: createVehicleSchema },
  },
  async (request, context) => {
    const data = context.body;

    // Check for duplicate registration number
    const existing = await context.prisma.vehicle.findFirst({
      where: {
        tenantId: context.tenantId,
        registrationNumber: data.registrationNumber,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'A vehicle with this registration number already exists',
          },
        },
        { status: 409 }
      );
    }

    const vehicle = await context.prisma.vehicle.create({
      data: {
        tenantId: context.tenantId,
        registrationNumber: data.registrationNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        type: data.type,
        initialCost: data.initialCost,
        currentMileage: data.currentMileage || 0,
        status: data.status || 'ACTIVE',
      },
      include: {
        drivers: true,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  }
);
import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandler,
  withTenantContext,
  parsePaginationParams,
  calculateSkip,
  buildOrderBy,
  paginatedResponse,
} from '@/lib/api';
import { logger } from '@/lib/logger';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceTypeEnum,
} from '@/lib/validations/maintenance';

/**
 * GET /api/maintenance
 * Fetch maintenance records with pagination and filters
 */
export const GET = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const { page = 1, limit = 25, sortBy = 'date', sortOrder = 'desc' } = parsePaginationParams(searchParams);
    const skip = calculateSkip(page, limit);

    // Parse filter parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');

    // Build where clause
    const where: any = {
      tenantId: tenantId!,
    };

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Other filters
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) {
      // Validate type is valid enum value
      const validType = maintenanceTypeEnum.safeParse(type);
      if (validType.success) {
        where.type = validType.data;
      }
    }

    // Execute query with pagination
    const [maintenanceRecords, total] = await prisma.$transaction([
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              model: true,
              make: true,
            },
          },
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip,
        take: limit,
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    logger.info(
      {
        tenantId,
        count: maintenanceRecords.length,
        total,
        filters: { startDate, endDate, vehicleId, type },
      },
      'Fetched maintenance records'
    );

    return paginatedResponse(serializePrismaResults(maintenanceRecords), total, page, limit);
  }),
  'maintenance:GET'
);

/**
 * POST /api/maintenance
 * Create a new maintenance record
 */
export const POST = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;
    const body = await request.json();

    // Validate input
    const validatedData = createMaintenanceSchema.parse(body);

    // Verify vehicle exists and belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: validatedData.vehicleId,
        tenantId: tenantId!,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    // Create maintenance record
    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: {
        tenantId: tenantId!,
        vehicleId: validatedData.vehicleId,
        date: validatedData.date,
        mileage: validatedData.mileage,
        type: validatedData.type,
        description: validatedData.description,
        cost: validatedData.cost,
        provider: validatedData.provider,
        invoice: validatedData.invoice || null,
        nextServiceMileage: validatedData.nextServiceMileage || null,
        nextServiceDate: validatedData.nextServiceDate || null,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            model: true,
            make: true,
          },
        },
      },
    });

    logger.info(
      {
        tenantId,
        maintenanceId: maintenanceRecord.id,
        vehicleId: validatedData.vehicleId,
        type: validatedData.type,
        cost: validatedData.cost,
      },
      'Maintenance record created'
    );

    return NextResponse.json(serializePrismaResults(maintenanceRecord), { status: 201 });
  }),
  'maintenance:POST'
);
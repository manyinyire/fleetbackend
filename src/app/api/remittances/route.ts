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
  createRemittanceSchema,
  updateRemittanceSchema,
  remittanceStatusEnum,
} from '@/lib/validations/financial';
import { z } from 'zod';

/**
 * GET /api/remittances
 * Fetch remittances with pagination and filters
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
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');

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
    if (driverId) where.driverId = driverId;
    if (status) {
      // Validate status is valid enum value
      const validStatus = remittanceStatusEnum.safeParse(status);
      if (validStatus.success) {
        where.status = validStatus.data;
      }
    }

    // Execute query with pagination
    const [remittances, total] = await prisma.$transaction([
      prisma.remittance.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              model: true,
            },
          },
          driver: {
            select: {
              id: true,
              fullName: true,
              licenseNumber: true,
            },
          },
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip,
        take: limit,
      }),
      prisma.remittance.count({ where }),
    ]);

    logger.info(
      {
        tenantId,
        count: remittances.length,
        total,
        filters: { startDate, endDate, vehicleId, driverId, status },
      },
      'Fetched remittances'
    );

    return paginatedResponse(serializePrismaResults(remittances), total, page, limit);
  }),
  'remittances:GET'
);

/**
 * POST /api/remittances
 * Create a new remittance
 */
export const POST = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;
    const body = await request.json();

    // Validate input
    const validatedData = createRemittanceSchema.parse(body);

    // Verify driver and vehicle exist and belong to tenant
    const [driver, vehicle] = await Promise.all([
      prisma.driver.findFirst({
        where: {
          id: validatedData.driverId,
          tenantId: tenantId!,
        },
      }),
      prisma.vehicle.findFirst({
        where: {
          id: validatedData.vehicleId,
          tenantId: tenantId!,
        },
      }),
    ]);

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    // Create remittance
    const remittance = await prisma.remittance.create({
      data: {
        tenantId: tenantId!,
        driverId: validatedData.driverId,
        vehicleId: validatedData.vehicleId,
        amount: validatedData.amount,
        date: validatedData.date,
        notes: validatedData.notes,
        receiptUrl: validatedData.receiptUrl,
        status: 'PENDING',
      },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            model: true,
          },
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            licenseNumber: true,
          },
        },
      },
    });

    logger.info(
      {
        tenantId,
        remittanceId: remittance.id,
        driverId: validatedData.driverId,
        vehicleId: validatedData.vehicleId,
        amount: validatedData.amount,
      },
      'Remittance created'
    );

    return NextResponse.json(serializePrismaResults(remittance), { status: 201 });
  }),
  'remittances:POST'
);
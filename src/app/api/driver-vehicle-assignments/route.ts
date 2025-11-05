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
import { createAssignmentSchema } from '@/lib/validations/assignment';

/**
 * GET /api/driver-vehicle-assignments
 * Fetch driver-vehicle assignments with pagination and filters
 */
export const GET = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const { page = 1, limit = 25, sortBy = 'createdAt', sortOrder = 'desc' } = parsePaginationParams(searchParams);
    const skip = calculateSkip(page, limit);

    // Parse filter parameters
    const driverId = searchParams.get('driverId');
    const vehicleId = searchParams.get('vehicleId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Build where clause
    const where: any = {
      tenantId: tenantId!,
    };

    if (driverId) where.driverId = driverId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (activeOnly) where.endDate = null;

    // Execute query with pagination
    const [assignments, total] = await prisma.$transaction([
      prisma.driverVehicleAssignment.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              licenseNumber: true,
              phone: true,
            },
          },
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
      prisma.driverVehicleAssignment.count({ where }),
    ]);

    logger.info(
      {
        tenantId,
        count: assignments.length,
        total,
        filters: { driverId, vehicleId, activeOnly },
      },
      'Fetched driver-vehicle assignments'
    );

    return paginatedResponse(serializePrismaResults(assignments), total, page, limit);
  }),
  'assignments:GET'
);

/**
 * POST /api/driver-vehicle-assignments
 * Create a new driver-vehicle assignment
 */
export const POST = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;
    const body = await request.json();

    // Validate input
    const validatedData = createAssignmentSchema.parse(body);

    // Check if driver and vehicle exist and belong to tenant
    const [driver, vehicle] = await Promise.all([
      prisma.driver.findFirst({
        where: { id: validatedData.driverId, tenantId: tenantId! },
      }),
      prisma.vehicle.findFirst({
        where: { id: validatedData.vehicleId, tenantId: tenantId! },
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

    // Check if there's already an active assignment for this driver to this vehicle
    const existingAssignment = await prisma.driverVehicleAssignment.findFirst({
      where: {
        driverId: validatedData.driverId,
        vehicleId: validatedData.vehicleId,
        endDate: null,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Driver is already assigned to this vehicle' },
        { status: 400 }
      );
    }

    // Check if the vehicle is already assigned to ANY driver
    const vehicleAssignment = await prisma.driverVehicleAssignment.findFirst({
      where: {
        vehicleId: validatedData.vehicleId,
        endDate: null,
      },
      include: {
        driver: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (vehicleAssignment) {
      return NextResponse.json(
        {
          error: `This vehicle is already assigned to ${vehicleAssignment.driver.fullName}`,
        },
        { status: 400 }
      );
    }

    // If isPrimary, unset all other primary assignments for this driver
    if (validatedData.isPrimary) {
      await prisma.driverVehicleAssignment.updateMany({
        where: {
          driverId: validatedData.driverId,
          isPrimary: true,
          endDate: null,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Create assignment
    const assignment = await prisma.driverVehicleAssignment.create({
      data: {
        tenantId: tenantId!,
        driverId: validatedData.driverId,
        vehicleId: validatedData.vehicleId,
        isPrimary: validatedData.isPrimary,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate || null,
      },
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            licenseNumber: true,
          },
        },
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
        assignmentId: assignment.id,
        driverId: validatedData.driverId,
        vehicleId: validatedData.vehicleId,
        isPrimary: validatedData.isPrimary,
      },
      'Driver-vehicle assignment created'
    );

    return NextResponse.json(serializePrismaResults(assignment), { status: 201 });
  }),
  'assignments:POST'
);

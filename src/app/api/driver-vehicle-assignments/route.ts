import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, successResponse, validateBody, getPaginationFromRequest, paginationResponse } from '@/lib/api-middleware';
import { z } from 'zod';

// Validation schema for creating an assignment
const createAssignmentSchema = z.object({
  driverId: z.string().uuid('Invalid driver ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  isPrimary: z.boolean().optional().default(true),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional().nullable(),
});

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get('driverId');
  const vehicleId = searchParams.get('vehicleId');
  const active = searchParams.get('active'); // 'true' or 'false'

  // Build where clause
  const where: any = {
    tenantId: tenantId,
  };

  if (driverId) where.driverId = driverId;
  if (vehicleId) where.vehicleId = vehicleId;
  if (active === 'true') where.endDate = null;
  if (active === 'false') where.endDate = { not: null };

  const [assignments, total] = await Promise.all([
    prisma.driverVehicleAssignment.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            licenseNumber: true,
            status: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.driverVehicleAssignment.count({ where }),
  ]);

  return successResponse(paginationResponse(assignments, total, page, limit));
});

export const POST = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const data = await validateBody(request, createAssignmentSchema);

  // Check if driver and vehicle exist and belong to tenant
  const [driver, vehicle] = await Promise.all([
    prisma.driver.findFirst({
      where: { id: data.driverId, tenantId },
    }),
    prisma.vehicle.findFirst({
      where: { id: data.vehicleId, tenantId },
    }),
  ]);

  if (!driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  }

  // Check if there's already an active assignment for this driver to this vehicle
  const existingAssignment = await prisma.driverVehicleAssignment.findFirst({
    where: {
      tenantId,
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      endDate: null,
    },
  });

  if (existingAssignment) {
    return NextResponse.json(
      { error: 'Driver is already assigned to this vehicle' },
      { status: 409 }
    );
  }

  // Check if the vehicle is already assigned to ANY driver
  const vehicleAssignment = await prisma.driverVehicleAssignment.findFirst({
    where: {
      tenantId,
      vehicleId: data.vehicleId,
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
      { error: `This vehicle is already assigned to ${vehicleAssignment.driver.fullName}` },
      { status: 409 }
    );
  }

  // If isPrimary, end all other primary assignments for this driver
  if (data.isPrimary) {
    await prisma.driverVehicleAssignment.updateMany({
      where: {
        tenantId,
        driverId: data.driverId,
        isPrimary: true,
        endDate: null,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  const assignment = await prisma.driverVehicleAssignment.create({
    data: {
      tenantId,
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      isPrimary: data.isPrimary,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          licenseNumber: true,
          status: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          make: true,
          model: true,
          type: true,
          status: true,
        },
      },
    },
  });

  return successResponse(assignment, 201);
});

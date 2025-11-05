import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, successResponse, validateBody, getPaginationFromRequest, paginationResponse } from '@/lib/api-middleware';
import { z } from 'zod';

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

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  // Build where clause
  const where: any = {
    tenantId: tenantId,
  };

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { registrationNumber: { contains: search, mode: 'insensitive' } },
      { make: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        drivers: {
          where: {
            endDate: null, // Active assignments only
          },
          include: {
            driver: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                licenseNumber: true,
              },
            },
          },
        },
        _count: {
          select: {
            maintenanceRecords: true,
            remittances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return successResponse(paginationResponse(vehicles, total, page, limit));
});

export const POST = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const data = await validateBody(request, createVehicleSchema);

  // Check for duplicate registration number
  const existing = await prisma.vehicle.findFirst({
    where: {
      tenantId: tenantId,
      registrationNumber: data.registrationNumber,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: `A vehicle with registration number "${data.registrationNumber}" already exists` },
      { status: 409 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId,
      registrationNumber: data.registrationNumber,
      make: data.make,
      model: data.model,
      year: data.year,
      type: data.type,
      initialCost: data.initialCost,
      currentMileage: data.currentMileage,
      status: data.status,
      paymentModel: data.paymentModel,
      paymentConfig: data.paymentConfig,
    },
    include: {
      drivers: {
        include: {
          driver: true,
        },
      },
    },
  });

  return successResponse(vehicle, 201);
});

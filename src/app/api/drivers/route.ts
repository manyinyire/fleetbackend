import { NextRequest, NextResponse } from 'next/server';
import { createGetHandler, createPostHandler } from '@/middleware/api-middleware';
import { getDriversSchema, createDriverSchema } from '@/lib/api-schemas';
import { parsePaginationParams, createPaginatedResponse, getSkipValue, buildOrderBy } from '@/lib/pagination';

/**
 * GET /api/drivers
 * List all drivers for the current tenant with pagination and filtering
 */
export const GET = createGetHandler(
  {
    auth: 'required',
    requireTenant: true,
    validate: { query: getDriversSchema },
  },
  async (request, context) => {
    const { page, limit, sortBy, sortOrder } = parsePaginationParams(
      context.searchParams!,
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    const search = context.searchParams?.get('search');
    const status = context.searchParams?.get('status');
    const paymentModel = context.searchParams?.get('paymentModel');

    // Build where clause
    const where: any = { tenantId: context.tenantId };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentModel) {
      where.paymentModel = paymentModel;
    }

    // Fetch drivers with pagination
    const [drivers, totalCount] = await Promise.all([
      context.prisma.driver.findMany({
        where,
        include: {
          vehicles: {
            include: {
              vehicle: true
            }
          },
          remittances: {
            orderBy: { date: 'desc' },
            take: 5
          }
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip: getSkipValue(page, limit),
        take: limit,
      }),
      context.prisma.driver.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(drivers, page, limit, totalCount)
    );
  }
);

/**
 * POST /api/drivers
 * Create a new driver for the current tenant
 */
export const POST = createPostHandler(
  {
    auth: 'required',
    requireTenant: true,
    validate: { body: createDriverSchema },
  },
  async (request, context) => {
    const data = context.body;

    // Check for duplicate national ID
    const existing = await context.prisma.driver.findFirst({
      where: {
        tenantId: context.tenantId,
        nationalId: data.nationalId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'A driver with this national ID already exists',
          },
        },
        { status: 409 }
      );
    }

    const driver = await context.prisma.driver.create({
      data: {
        tenantId: context.tenantId,
        fullName: data.fullName,
        nationalId: data.nationalId,
        licenseNumber: data.licenseNumber,
        phone: data.phone,
        email: data.email || null,
        homeAddress: data.homeAddress,
        nextOfKin: data.nextOfKin,
        nextOfKinPhone: data.nextOfKinPhone,
        hasDefensiveLicense: data.hasDefensiveLicense,
        defensiveLicenseNumber: data.defensiveLicenseNumber || null,
        defensiveLicenseExpiry: data.defensiveLicenseExpiry
          ? new Date(data.defensiveLicenseExpiry)
          : null,
        paymentModel: data.paymentModel,
        paymentConfig: data.paymentConfig,
        debtBalance: data.debtBalance || 0,
        status: data.status || 'ACTIVE',
      },
      include: {
        vehicles: true,
      },
    });

    return NextResponse.json(driver, { status: 201 });
  }
);
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, withErrorHandler, parsePaginationParams, paginatedResponse, calculateSkip, buildOrderBy } from '@/lib/api';
import { createDriverSchema } from '@/lib/validations/driver';
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
    const [drivers, total] = await prisma.$transaction([
      prisma.driver.findMany({
        where,
        include: {
          vehicles: {
            include: {
              vehicle: true,
            },
          },
          remittances: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ]);

    logger.info({ tenantId, count: drivers.length, total }, 'Fetched drivers');

    return paginatedResponse(serializePrismaResults(drivers), total, page, limit);
  }),
  'drivers:GET'
);

export const POST = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createDriverSchema.parse(body);

    // Create driver
    const driver = await prisma.driver.create({
      data: {
        tenantId: tenantId!,
        fullName: validatedData.fullName,
        nationalId: validatedData.nationalId,
        licenseNumber: validatedData.licenseNumber,
        phone: validatedData.phone,
        email: validatedData.email || null,
        homeAddress: validatedData.homeAddress,
        nextOfKin: validatedData.nextOfKin,
        nextOfKinPhone: validatedData.nextOfKinPhone,
        hasDefensiveLicense: validatedData.hasDefensiveLicense || false,
        defensiveLicenseNumber: validatedData.defensiveLicenseNumber,
        defensiveLicenseExpiry: validatedData.defensiveLicenseExpiry ? new Date(validatedData.defensiveLicenseExpiry) : null,
        debtBalance: 0,
        status: 'ACTIVE',
      },
    });

    logger.info({ tenantId, driverId: driver.id }, 'Driver created');

    return NextResponse.json(serializePrismaResults(driver), { status: 201 });
  }),
  'drivers:POST'
);

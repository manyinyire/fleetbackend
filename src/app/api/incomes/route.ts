import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, withErrorHandler, parsePaginationParams, paginatedResponse, calculateSkip, buildOrderBy } from '@/lib/api';
import { createIncomeSchema, incomeSourceEnum } from '@/lib/validations/financial';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const { page = 1, limit = 50, sortBy = 'date', sortOrder = 'desc' } = parsePaginationParams(searchParams);
    const skip = calculateSkip(page, limit);

    // Parse filter parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const source = searchParams.get('source');
    const vehicleId = searchParams.get('vehicleId');

    // Build where clause
    const where: any = { tenantId: tenantId! };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (source) where.source = source;
    if (vehicleId) where.vehicleId = vehicleId;

    // Execute query with pagination
    const [incomes, total] = await prisma.$transaction([
      prisma.income.findMany({
        where,
        include: {
          vehicle: true,
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip,
        take: limit,
      }),
      prisma.income.count({ where }),
    ]);

    logger.info({ tenantId, count: incomes.length, total, filters: { startDate, endDate, source, vehicleId } }, 'Fetched incomes');

    return paginatedResponse(serializePrismaResults(incomes), total, page, limit);
  }),
  'incomes:GET'
);

export const POST = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createIncomeSchema.parse(body);

    // Create income
    const income = await prisma.income.create({
      data: {
        tenantId: tenantId!,
        vehicleId: validatedData.vehicleId,
        source: validatedData.source,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        description: validatedData.description,
      },
      include: {
        vehicle: true,
      },
    });

    logger.info({ tenantId, incomeId: income.id, amount: income.amount }, 'Income created');

    return NextResponse.json(serializePrismaResults(income), { status: 201 });
  }),
  'incomes:POST'
);

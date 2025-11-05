import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, withErrorHandler, parsePaginationParams, paginatedResponse, calculateSkip, buildOrderBy } from '@/lib/api';
import { createExpenseSchema, expenseCategoryEnum } from '@/lib/validations/financial';
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
    const category = searchParams.get('category');
    const vehicleId = searchParams.get('vehicleId');

    // Build where clause
    const where: any = { tenantId: tenantId! };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (category) where.category = category;
    if (vehicleId) where.vehicleId = vehicleId;

    // Execute query with pagination
    const [expenses, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        include: {
          vehicle: true,
        },
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    logger.info({ tenantId, count: expenses.length, total, filters: { startDate, endDate, category, vehicleId } }, 'Fetched expenses');

    return paginatedResponse(serializePrismaResults(expenses), total, page, limit);
  }),
  'expenses:GET'
);

export const POST = withErrorHandler(
  withTenantContext(async (context, request) => {
    const { prisma, tenantId } = context;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createExpenseSchema.parse(body);

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        tenantId: tenantId!,
        vehicleId: validatedData.vehicleId,
        category: validatedData.category,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        description: validatedData.description,
        receipt: validatedData.receipt,
      },
      include: {
        vehicle: true,
      },
    });

    logger.info({ tenantId, expenseId: expense.id, amount: expense.amount }, 'Expense created');

    return NextResponse.json(serializePrismaResults(expense), { status: 201 });
  }),
  'expenses:POST'
);

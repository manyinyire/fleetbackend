import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, successResponse, validateBody, getPaginationFromRequest, getDateRangeFromRequest, paginationResponse } from '@/lib/api-middleware';
import { serializePrismaResults, serializePrismaData } from '@/lib/serialize-prisma';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema for creating an expense
const createExpenseSchema = z.object({
  vehicleId: z.string().uuid().optional().nullable(),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  description: z.string().min(1, 'Description is required'),
  receipt: z.string().url().optional().nullable(),
  status: z.nativeEnum(ExpenseStatus).optional().default('PENDING'),
});

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { startDate, endDate } = getDateRangeFromRequest(request);
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const vehicleId = searchParams.get('vehicleId');
  const status = searchParams.get('status');

  // Build where clause
  const where: any = {
    tenantId: tenantId,
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  if (category) where.category = category;
  if (vehicleId) where.vehicleId = vehicleId;
  if (status) where.status = status;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  // Convert Decimal objects to numbers
  const serializedExpenses = serializePrismaResults(expenses);

  return successResponse(paginationResponse(serializedExpenses, total, page, limit));
});

export const POST = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const data = await validateBody(request, createExpenseSchema);

  const expense = await prisma.expense.create({
    data: {
      tenantId,
      vehicleId: data.vehicleId || null,
      category: data.category,
      amount: data.amount,
      date: new Date(data.date),
      description: data.description,
      receipt: data.receipt || null,
      status: data.status,
    },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          make: true,
          model: true,
        },
      },
    },
  });

  return successResponse(serializePrismaData(expense), 201);
});

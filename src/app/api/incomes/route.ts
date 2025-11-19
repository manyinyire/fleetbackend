import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth, successResponse, validateBody, getPaginationFromRequest, getDateRangeFromRequest, paginationResponse } from '@/lib/api-middleware';
import { serializePrismaResults, serializePrismaData } from '@/lib/serialize-prisma';
import { IncomeSource } from '@prisma/client';
import { z } from 'zod';

// Validation schema for creating an income
const createIncomeSchema = z.object({
  vehicleId: z.string().uuid().optional().nullable(),
  source: z.nativeEnum(IncomeSource),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  description: z.string().optional().nullable(),
});

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { startDate, endDate } = getDateRangeFromRequest(request);
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const vehicleId = searchParams.get('vehicleId');

  // Build where clause
  const where: any = {
    tenantId: tenantId,
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  if (source) where.source = source;
  if (vehicleId) where.vehicleId = vehicleId;

  const [incomes, total] = await Promise.all([
    prisma.income.findMany({
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
    prisma.income.count({ where }),
  ]);

  // Convert Decimal objects to numbers
  const serializedIncomes = serializePrismaResults(incomes);

  return successResponse(paginationResponse(serializedIncomes, total, page, limit));
});

export const POST = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const data = await validateBody(request, createIncomeSchema);

  const income = await prisma.income.create({
    data: {
      tenantId,
      vehicleId: data.vehicleId || null,
      source: data.source,
      amount: data.amount,
      date: new Date(data.date),
      description: data.description || null,
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

  return successResponse(serializePrismaData(income), 201);
});

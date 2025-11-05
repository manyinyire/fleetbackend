import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, getPaginationFromRequest, getDateRangeFromRequest, paginationResponse } from '@/lib/api-middleware';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import {
  createRemittanceSchema,
  updateRemittanceSchema,
  remittanceStatusEnum,
} from '@/lib/validations/financial';
import { z } from 'zod';

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { startDate, endDate } = getDateRangeFromRequest(request);
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');
  const driverId = searchParams.get('driverId');
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

  if (vehicleId) where.vehicleId = vehicleId;
  if (driverId) where.driverId = driverId;
  if (status) where.status = status;

  const [remittances, total] = await Promise.all([
    prisma.remittance.findMany({
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
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            licenseNumber: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.remittance.count({ where }),
  ]);

  // Convert Decimal objects to numbers
  const serializedRemittances = serializePrismaResults(remittances);

  return successResponse(paginationResponse(serializedRemittances, total, page, limit));
});

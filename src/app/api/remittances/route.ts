import { NextRequest } from 'next/server';
import { withTenantAuth, ApiContext, successResponse, getPaginationFromRequest, getDateRangeFromRequest } from '@/lib/api-middleware';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import { RemittanceStatus } from '@prisma/client';

/**
 * GET /api/remittances
 * List all remittances with filtering and pagination
 */
export const GET = withTenantAuth(async ({ services, request }: ApiContext) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { startDate, endDate } = getDateRangeFromRequest(request);
  const { searchParams } = new URL(request.url);

  const filters = {
    vehicleId: searchParams.get('vehicleId') || undefined,
    driverId: searchParams.get('driverId') || undefined,
    status: (searchParams.get('status') as RemittanceStatus) || undefined,
    targetReached: searchParams.get('targetReached') === 'true' ? true : searchParams.get('targetReached') === 'false' ? false : undefined,
    startDate,
    endDate,
    page,
    limit,
  };

  // Use RemittanceService for business logic
  const result = await services.remittances.findAll(filters);

  // Serialize Decimal objects to numbers
  const serialized = {
    remittances: serializePrismaResults(result.remittances),
    pagination: result.pagination,
  };

  return successResponse(serialized);
});

import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, getPaginationFromRequest, paginationResponse } from '@/lib/api-middleware';

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Build where clause
  const where: any = {
    tenantId: tenantId,
  };

  if (status && ['PENDING', 'PAID', 'OVERDUE', 'CANCELED'].includes(status)) {
    where.status = status;
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return successResponse(paginationResponse(invoices, total, page, limit));
});

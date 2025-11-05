import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse } from '@/lib/api-middleware';

export const GET = withTenantAuth(async ({ prisma, tenantId, request }, { params }) => {
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: id,
      tenantId: tenantId,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        include: {
          settings: true,
        },
      },
    },
  });

  if (!invoice) {
    return successResponse({ error: 'Invoice not found' }, 404);
  }

  return successResponse(invoice);
});

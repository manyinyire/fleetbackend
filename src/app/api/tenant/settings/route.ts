import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse } from '@/lib/api-middleware';

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  // Fetch tenant name directly from Tenant model
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      name: true,
    },
  });

  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: {
      tenantId: tenantId,
    },
    select: {
      companyName: true,
      logoUrl: true,
      primaryColor: true,
    },
  });

  // Return tenant name (prefer settings companyName, fallback to tenant name)
  return successResponse({
    companyName: tenantSettings?.companyName || tenant?.name || 'Azaire Fleet Manager',
    tenantName: tenant?.name || tenantSettings?.companyName || 'Azaire Fleet Manager',
    logoUrl: tenantSettings?.logoUrl,
    primaryColor: tenantSettings?.primaryColor,
  });
});

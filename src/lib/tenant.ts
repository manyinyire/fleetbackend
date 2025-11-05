import { prisma } from './prisma';
import { cache } from 'react';
import { z } from 'zod';

// Validate tenant ID format (CUID)
const tenantIdSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid tenant ID format');

export async function setTenantContext(
  tenantId: string,
  isSuperAdmin: boolean = false
) {
  // Validate tenant ID format to prevent SQL injection
  try {
    tenantIdSchema.parse(tenantId);
  } catch (error) {
    throw new Error(`Invalid tenant ID format: ${tenantId}`);
  }

  // Use $queryRaw with template literals for safe parameterized queries
  // This prevents SQL injection by properly escaping parameters
  await prisma.$queryRaw`
    SELECT set_config('app.current_tenant_id', ${tenantId}::TEXT, FALSE)
  `;

  await prisma.$queryRaw`
    SELECT set_config('app.is_super_admin', ${isSuperAdmin ? 'true' : 'false'}::TEXT, FALSE)
  `;
}

export async function getTenantId(): Promise<string | null> {
  // Use $queryRaw with template literals instead of $queryRawUnsafe
  const result = await prisma.$queryRaw<Array<{ current_setting: string }>>`
    SELECT current_setting('app.current_tenant_id', true) as current_setting
  `;
  return result[0]?.current_setting || null;
}

export const getTenantSettings = cache(async (tenantId: string) => {
  const prisma = (await import('./get-tenant-prisma')).getTenantPrisma(tenantId);
  
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId }
  });
  
  // Return with defaults if not found
  return settings || {
    companyName: 'Fleet Company',
    email: 'info@example.com',
    phone: '+263 77 123 4567',
    primaryColor: '#1e3a8a',
    currency: 'USD',
    timezone: 'Africa/Harare',
    dateFormat: 'YYYY-MM-DD',
    country: 'Zimbabwe',
  };
});
import { prisma } from './prisma';
import { cache } from 'react';

export async function setTenantContext(
  tenantId: string, 
  isSuperAdmin: boolean = false
) {
  // Set PostgreSQL session variables for RLS
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.current_tenant_id', $1::TEXT, FALSE)`,
    tenantId
  );
  
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.is_super_admin', $1::TEXT, FALSE)`,
    isSuperAdmin ? 'true' : 'false'
  );
}

export async function getTenantId(): Promise<string | null> {
  const result = await prisma.$queryRawUnsafe<Array<{ current_setting: string }>>(
    `SELECT current_setting('app.current_tenant_id', true) as current_setting`
  );
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
    invoicePrefix: 'INV',
    currency: 'USD',
    timezone: 'Africa/Harare',
    dateFormat: 'YYYY-MM-DD',
    country: 'Zimbabwe',
    emailNotifications: true,
    smsNotifications: false,
  };
});
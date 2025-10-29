import { prisma } from './prisma';
import { cache } from 'react';

/**
 * Set tenant context for Row-Level Security (RLS)
 * Uses parameterized queries to safely set PostgreSQL session variables
 * 
 * @param tenantId - The tenant ID to set in the session
 * @param isSuperAdmin - Whether the current user is a super admin
 */
export async function setTenantContext(
  tenantId: string, 
  isSuperAdmin: boolean = false
) {
  // Set PostgreSQL session variables for RLS using safe parameterized queries
  // Note: Prisma doesn't have a "safe" version of set_config, but we use parameters
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}::TEXT, FALSE)`;
  await prisma.$executeRaw`SELECT set_config('app.is_super_admin', ${isSuperAdmin ? 'true' : 'false'}::TEXT, FALSE)`;
}

/**
 * Get the current tenant ID from the PostgreSQL session
 * 
 * @returns The tenant ID or null if not set
 */
export async function getTenantId(): Promise<string | null> {
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
    invoicePrefix: 'INV',
    currency: 'USD',
    timezone: 'Africa/Harare',
    dateFormat: 'YYYY-MM-DD',
    country: 'Zimbabwe',
    emailNotifications: true,
    smsNotifications: false,
  };
});
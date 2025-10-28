'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

export async function updateTenantSettings(data: any) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Upsert settings
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      ...data,
    },
    update: data,
  });

  // Revalidate all pages to reflect new settings
  revalidatePath('/', 'layout');
  
  return settings;
}
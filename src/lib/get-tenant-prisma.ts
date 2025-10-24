import { prisma } from './prisma';
import { tenantExtension } from './prisma-tenant-extension';

const tenantPrismaCache = new Map();

export function getTenantPrisma(tenantId: string) {
  // Cache extended clients per tenant for performance
  if (!tenantPrismaCache.has(tenantId)) {
    const extendedPrisma = prisma.$extends(tenantExtension(tenantId));
    tenantPrismaCache.set(tenantId, extendedPrisma);
  }
  
  return tenantPrismaCache.get(tenantId);
}
import { prisma } from './prisma';
import { tenantExtension } from './prisma-tenant-extension';

/**
 * Thread-safe cache for tenant-scoped Prisma clients
 * Using Map with atomic get-or-create pattern to prevent race conditions
 */
const tenantPrismaCache = new Map<string, ReturnType<typeof prisma.$extends>>();

/**
 * Get or create a tenant-scoped Prisma client
 * This function ensures that each tenant gets a properly scoped Prisma instance
 * with automatic tenant filtering via the tenant extension
 *
 * @param tenantId - The tenant ID to scope the Prisma client to
 * @returns A Prisma client extended with tenant-scoping middleware
 */
export function getTenantPrisma(tenantId: string) {
  // Atomic get-or-create to prevent race conditions
  // If the tenant client exists, return it; otherwise, create and cache it
  let extendedPrisma = tenantPrismaCache.get(tenantId);

  if (!extendedPrisma) {
    extendedPrisma = prisma.$extends(tenantExtension(tenantId));
    tenantPrismaCache.set(tenantId, extendedPrisma);
  }

  return extendedPrisma;
}

/**
 * Clear the tenant Prisma cache (useful for testing or when tenant data changes)
 * @param tenantId - Optional tenant ID to clear specific tenant, or clear all if not provided
 */
export function clearTenantPrismaCache(tenantId?: string) {
  if (tenantId) {
    tenantPrismaCache.delete(tenantId);
  } else {
    tenantPrismaCache.clear();
  }
}
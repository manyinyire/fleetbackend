import { prisma } from './prisma';
import { tenantExtension } from './prisma-tenant-extension';
import { apiLogger } from './logger';

/**
 * LRU Cache for tenant-scoped Prisma clients
 * Prevents memory leaks in high-churn SaaS environments by evicting least recently used entries
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  private accessOrder: K[];

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
    return value;
  }

  set(key: K, value: V): void {
    // If key exists, update and mark as recently used
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      return;
    }

    // If at capacity, evict least recently used
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
        apiLogger.debug({ tenantId: lruKey }, 'Evicted tenant Prisma client from LRU cache');
      }
    }

    // Add new entry
    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  delete(key: K): boolean {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Type for extended Prisma client with tenant scoping
 */
type ExtendedPrismaClient = any;

/**
 * LRU cache for tenant-scoped Prisma clients
 * Maximum 100 tenants cached at once to prevent unbounded memory growth
 * In a high-churn SaaS, this ensures memory usage stays bounded
 */
const tenantPrismaCache = new LRUCache<string, ExtendedPrismaClient>(100);

/**
 * Get or create a tenant-scoped Prisma client
 * This function ensures that each tenant gets a properly scoped Prisma instance
 * with automatic tenant filtering via the tenant extension
 *
 * Uses LRU caching to prevent memory leaks in high-churn environments
 *
 * @param tenantId - The tenant ID to scope the Prisma client to
 * @returns A Prisma client extended with tenant-scoping middleware
 */
export function getTenantPrisma(tenantId: string): ExtendedPrismaClient {
  // Atomic get-or-create with LRU eviction
  let extendedPrisma = tenantPrismaCache.get(tenantId);

  if (!extendedPrisma) {
    extendedPrisma = prisma.$extends(tenantExtension(tenantId)) as ExtendedPrismaClient;
    tenantPrismaCache.set(tenantId, extendedPrisma);
    apiLogger.debug({ tenantId, cacheSize: tenantPrismaCache.size() }, 'Created tenant Prisma client');
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
    apiLogger.debug({ tenantId }, 'Cleared tenant Prisma client from cache');
  } else {
    tenantPrismaCache.clear();
    apiLogger.debug('Cleared all tenant Prisma clients from cache');
  }
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getTenantPrismaCacheStats() {
  return {
    size: tenantPrismaCache.size(),
    maxSize: 100,
  };
}
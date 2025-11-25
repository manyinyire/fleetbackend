import { getRedisClient, isRedisAvailable } from './redis';
import { apiLogger } from './logger';

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Centralized caching service using Redis
 * Falls back gracefully when Redis is unavailable
 */
export class CacheService {
    private redis = getRedisClient();

    /**
     * Get cached value
     */
    async get<T>(key: string): Promise<T | null> {
        if (!isRedisAvailable()) {
            return null;
        }

        try {
            const cached = await this.redis?.get(key);
            if (!cached) return null;

            return JSON.parse(cached) as T;
        } catch (error) {
            apiLogger.error({ err: error, key }, 'Cache get failed');
            return null;
        }
    }

    /**
     * Set cached value with TTL
     */
    async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<boolean> {
        if (!isRedisAvailable()) {
            return false;
        }

        try {
            await this.redis?.setex(key, ttl, JSON.stringify(value));
            apiLogger.debug({ key, ttl }, 'Cache set');
            return true;
        } catch (error) {
            apiLogger.error({ err: error, key }, 'Cache set failed');
            return false;
        }
    }

    /**
     * Delete cached value(s)
     */
    async del(key: string | string[]): Promise<boolean> {
        if (!isRedisAvailable()) {
            return false;
        }

        try {
            const keys = Array.isArray(key) ? key : [key];
            if (keys.length > 0) {
                await this.redis?.del(...keys);
                apiLogger.debug({ keys }, 'Cache deleted');
            }
            return true;
        } catch (error) {
            apiLogger.error({ err: error, key }, 'Cache delete failed');
            return false;
        }
    }

    /**
     * Invalidate all keys matching pattern
     */
    async invalidatePattern(pattern: string): Promise<number> {
        if (!isRedisAvailable()) {
            return 0;
        }

        try {
            const keys = await this.redis?.keys(pattern);
            if (!keys || keys.length === 0) return 0;

            await this.redis?.del(...keys);
            apiLogger.info({ pattern, count: keys.length }, 'Cache pattern invalidated');
            return keys.length;
        } catch (error) {
            apiLogger.error({ err: error, pattern }, 'Cache pattern invalidation failed');
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!isRedisAvailable()) {
            return false;
        }

        try {
            const result = await this.redis?.exists(key);
            return result === 1;
        } catch (error) {
            apiLogger.error({ err: error, key }, 'Cache exists check failed');
            return false;
        }
    }
}

export const cache = new CacheService();

// ============================================
// Tenant-specific cache helpers
// ============================================

/**
 * Cache tenant settings
 */
export async function cacheTenantSettings(tenantId: string, settings: any): Promise<boolean> {
    return cache.set(`tenant:${tenantId}:settings`, settings, 3600); // 1 hour
}

/**
 * Get cached tenant settings
 */
export async function getCachedTenantSettings(tenantId: string) {
    return cache.get(`tenant:${tenantId}:settings`);
}

/**
 * Invalidate all tenant cache
 */
export async function invalidateTenantCache(tenantId: string): Promise<number> {
    return cache.invalidatePattern(`tenant:${tenantId}:*`);
}

// ============================================
// Permission caching
// ============================================

/**
 * Cache user permissions
 */
export async function cacheUserPermissions(
    tenantId: string,
    userId: string,
    permissions: any
): Promise<boolean> {
    return cache.set(`tenant:${tenantId}:permissions:${userId}`, permissions, 1800); // 30 min
}

/**
 * Get cached user permissions
 */
export async function getCachedUserPermissions(tenantId: string, userId: string) {
    return cache.get(`tenant:${tenantId}:permissions:${userId}`);
}

/**
 * Invalidate user permissions cache
 */
export async function invalidateUserPermissions(tenantId: string, userId: string): Promise<boolean> {
    return cache.del(`tenant:${tenantId}:permissions:${userId}`);
}

// ============================================
// Feature limits caching
// ============================================

/**
 * Cache plan features
 */
export async function cachePlanFeatures(plan: string, features: any): Promise<boolean> {
    return cache.set(`plan:${plan}:features`, features, 86400); // 24 hours
}

/**
 * Get cached plan features
 */
export async function getCachedPlanFeatures(plan: string) {
    return cache.get(`plan:${plan}:features`);
}

// ============================================
// Entity caching (optional, for heavy reads)
// ============================================

/**
 * Cache vehicle details
 */
export async function cacheVehicle(vehicleId: string, vehicle: any): Promise<boolean> {
    return cache.set(`vehicle:${vehicleId}`, vehicle, 600); // 10 min
}

/**
 * Get cached vehicle
 */
export async function getCachedVehicle(vehicleId: string) {
    return cache.get(`vehicle:${vehicleId}`);
}

/**
 * Invalidate vehicle cache
 */
export async function invalidateVehicleCache(vehicleId: string): Promise<boolean> {
    return cache.del(`vehicle:${vehicleId}`);
}

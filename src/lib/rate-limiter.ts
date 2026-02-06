/**
 * API Rate Limiter
 * Implements rate limiting with Redis for API protection
 */

import { getRedisClient } from './redis';
import { apiLogger } from './logger';
import { SubscriptionPlan } from '@prisma/client';

const redis = getRedisClient();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// Rate limits per subscription plan
const PLAN_RATE_LIMITS: Record<SubscriptionPlan, RateLimitConfig> = {
  FREE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  BASIC: {
    windowMs: 60 * 1000,
    maxRequests: 300, // 300 requests per minute
  },
  PREMIUM: {
    windowMs: 60 * 1000,
    maxRequests: 1000, // 1000 requests per minute
  },
};

/**
 * Check rate limit for a user/tenant
 */
export async function checkRateLimit(
  identifier: string,
  plan: SubscriptionPlan = 'FREE'
): Promise<RateLimitResult> {
  try {
    const config = PLAN_RATE_LIMITS[plan];
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // If Redis is not available, fail open
    if (!redis) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
        limit: config.maxRequests,
      };
    }

    // Use Redis sorted set to track requests
    const multi = redis.multi();
    
    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    multi.zcard(key);
    
    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry on key
    multi.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await multi.exec();
    
    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const count = results[1][1] as number;
    const allowed = count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetAt = new Date(now + config.windowMs);

    if (!allowed) {
      apiLogger.warn({ identifier, plan, count }, 'Rate limit exceeded');
    }

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    apiLogger.error({ error, identifier }, 'Rate limit check failed');
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: 0,
      resetAt: new Date(Date.now() + 60000),
      limit: 0,
    };
  }
}

/**
 * Reset rate limit for a user/tenant (admin function)
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    const key = `ratelimit:${identifier}`;
    await redis.del(key);
    apiLogger.info({ identifier }, 'Rate limit reset');
  } catch (error) {
    apiLogger.error({ error, identifier }, 'Failed to reset rate limit');
    throw error;
  }
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  plan: SubscriptionPlan = 'FREE'
): Promise<RateLimitResult> {
  try {
    const config = PLAN_RATE_LIMITS[plan];
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Count requests in current window
    const count = await redis.zcount(key, windowStart, now);
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = new Date(now + config.windowMs);

    return {
      allowed: count < config.maxRequests,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    apiLogger.error({ error, identifier }, 'Failed to get rate limit status');
    throw error;
  }
}

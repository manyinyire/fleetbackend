/**
 * Rate Limiting Utility
 *
 * Implements a sliding window rate limiter to prevent API abuse.
 * Supports plan-based rate limiting for FREE, BASIC, and PREMIUM tiers.
 * Uses in-memory storage for development, can be extended to use Redis for production.
 */

import { NextRequest } from 'next/server';
import { SubscriptionPlan } from '@prisma/client';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configurations for different route types
 */
export const rateLimitConfigs = {
  // Strict limits for authentication routes
  auth: {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },
  // Medium limits for API routes
  api: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Relaxed limits for general routes
  general: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  },
  // Very strict for super admin operations
  superAdmin: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
};

/**
 * Plan-based rate limit configurations
 * Different limits for each subscription tier
 */
export const planRateLimitConfigs: Record<SubscriptionPlan, {
  api: RateLimitConfig;
  export: RateLimitConfig;
  report: RateLimitConfig;
}> = {
  [SubscriptionPlan.FREE]: {
    api: {
      interval: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
    },
    export: {
      interval: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 exports per hour
    },
    report: {
      interval: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 10, // 10 reports per day
    },
  },
  [SubscriptionPlan.BASIC]: {
    api: {
      interval: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
    },
    export: {
      interval: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // 20 exports per hour
    },
    report: {
      interval: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 50, // 50 reports per day
    },
  },
  [SubscriptionPlan.PREMIUM]: {
    api: {
      interval: 60 * 1000, // 1 minute
      maxRequests: 300, // 300 requests per minute
    },
    export: {
      interval: 60 * 60 * 1000, // 1 hour
      maxRequests: 100, // 100 exports per hour (effectively unlimited)
    },
    report: {
      interval: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 500, // 500 reports per day (effectively unlimited)
    },
  },
};

/**
 * Get client identifier from request
 * Uses IP address and user agent for fingerprinting
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create a simple hash of IP + User Agent
  return `${ip}:${userAgent.slice(0, 50)}`;
}

/**
 * Check if request is rate limited
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Object with limited status and remaining requests
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
): {
  limited: boolean;
  remaining: number;
  resetTime: number;
} {
  const identifier = getClientIdentifier(request);
  const key = `${request.nextUrl.pathname}:${identifier}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  // No existing record, create new one
  if (!record || record.resetTime < now) {
    const resetTime = now + config.interval;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });

    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Existing record, increment count
  record.count++;

  if (record.count > config.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    limited: false,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit middleware helper
 * Returns NextResponse with 429 if rate limited
 */
export function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
) {
  const result = checkRateLimit(request, config);

  if (result.limited) {
    const resetDate = new Date(result.resetTime);
    return {
      limited: true,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          resetTime: resetDate.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetDate.toISOString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      ),
    };
  }

  return {
    limited: false,
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    },
  };
}

/**
 * Rate limit helper for API routes
 * Use this in your API route handlers
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, rateLimitConfigs.auth);
 *   if (rateLimitResult.limited) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
) {
  return rateLimitMiddleware(request, config);
}

/**
 * Plan-based rate limiting for API routes
 * Applies different limits based on subscription plan
 *
 * @param request - Next.js request object
 * @param plan - User's subscription plan
 * @param type - Type of operation (api, export, report)
 * @returns Rate limit result
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const user = await getCurrentUser();
 *   const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
 *
 *   const rateLimitResult = await rateLimitByPlan(request, tenant.plan, 'api');
 *   if (rateLimitResult.limited) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export async function rateLimitByPlan(
  request: NextRequest,
  plan: SubscriptionPlan = SubscriptionPlan.FREE,
  type: 'api' | 'export' | 'report' = 'api'
) {
  const config = planRateLimitConfigs[plan][type];
  return rateLimitMiddleware(request, config);
}

/**
 * Get plan-based rate limit configuration
 * Useful for displaying limits to users
 */
export function getPlanRateLimits(plan: SubscriptionPlan) {
  return planRateLimitConfigs[plan];
}

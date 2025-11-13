import { NextRequest, NextResponse } from 'next/server';
import { PremiumFeatureService } from '@/lib/premium-features';
import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * API Access Middleware
 * Checks if tenant has API access based on their subscription plan
 * Also enforces rate limits
 */
export async function checkApiAccess(request: NextRequest): Promise<NextResponse | null> {
  try {
    const { tenantId } = await requireTenantForDashboard();

    // Check if tenant has API access
    const featureCheck = await PremiumFeatureService.checkApiRateLimit(tenantId);

    if (!featureCheck.allowed) {
      return NextResponse.json(
        {
          error: featureCheck.reason,
          suggestedPlan: featureCheck.suggestedPlan,
          upgradeMessage: featureCheck.upgradeMessage,
        },
        { status: 403 }
      );
    }

    // Get tenant plan for rate limiting
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    // Apply rate limiting based on tenant plan
    const rateLimitResult = await checkRateLimit(
      request,
      tenant?.plan === 'PREMIUM'
        ? rateLimitConfigs.api
        : tenant?.plan === 'BASIC'
        ? { interval: 60 * 1000, maxRequests: 60 }
        : { interval: 60 * 1000, maxRequests: 30 }
    );

    if (rateLimitResult.limited) {
      apiLogger.warn({ tenantId, plan: tenant?.plan }, 'API rate limit exceeded');
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You have exceeded your API rate limit. Please try again later.',
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(featureCheck.limit || 'unlimited'),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // Add rate limit headers to successful response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(featureCheck.limit || 'unlimited'));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

    return null; // No error, continue
  } catch (error) {
    apiLogger.error({ error }, 'API access check error');
    return NextResponse.json(
      { error: 'Failed to verify API access' },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to wrap API routes with API access check
 */
export function withApiAccess(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const accessCheck = await checkApiAccess(request);
    if (accessCheck) {
      return accessCheck; // Return error response
    }
    return handler(request);
  };
}

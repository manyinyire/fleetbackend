import { NextRequest, NextResponse } from 'next/server';
import { PremiumFeatureService } from '@/lib/premium-features';
import { requireTenantForDashboard } from '@/lib/auth-helpers';

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

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(featureCheck.limit || 'unlimited'));
    // TODO: Implement actual rate limit tracking with Redis
    // response.headers.set('X-RateLimit-Remaining', String(remaining));
    // response.headers.set('X-RateLimit-Reset', String(resetTime));

    return null; // No error, continue
  } catch (error) {
    console.error('API access check error:', error);
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

import { NextResponse } from 'next/server';
import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { PremiumFeatureService } from '@/lib/premium-features';

/**
 * GET /api/tenant/features/usage
 * Get usage summary and feature limits for the current tenant
 */
export async function GET() {
  try {
    const { tenantId } = await requireTenantForDashboard();

    const usageSummary = await PremiumFeatureService.getUsageSummary(tenantId);

    return NextResponse.json({
      success: true,
      data: usageSummary,
    });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage summary' },
      { status: 500 }
    );
  }
}

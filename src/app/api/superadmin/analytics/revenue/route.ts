import { NextRequest, NextResponse } from "next/server";
import { subscriptionAnalyticsService } from "@/services/subscription-analytics.service";

/**
 * GET /api/superadmin/analytics/revenue
 * Get comprehensive revenue metrics
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await subscriptionAnalyticsService.getRevenueMetrics();

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error("Failed to fetch revenue metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue metrics" },
      { status: 500 }
    );
  }
}

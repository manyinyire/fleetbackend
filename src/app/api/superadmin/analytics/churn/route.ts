import { NextRequest, NextResponse } from "next/server";
import { subscriptionAnalyticsService } from "@/services/subscription-analytics.service";

/**
 * GET /api/superadmin/analytics/churn
 * Calculate churn metrics for a date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // Default to last 30 days
    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const churnMetrics = await subscriptionAnalyticsService.calculateChurnMetrics(
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      metrics: churnMetrics,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error("Failed to calculate churn metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate churn metrics" },
      { status: 500 }
    );
  }
}

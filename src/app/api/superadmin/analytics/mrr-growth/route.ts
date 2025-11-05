import { NextRequest, NextResponse } from "next/server";
import { subscriptionAnalyticsService } from "@/services/subscription-analytics.service";

/**
 * GET /api/superadmin/analytics/mrr-growth
 * Get MRR growth over time
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get("months") || "12");

    const growth = await subscriptionAnalyticsService.getMRRGrowth(months);

    return NextResponse.json({
      success: true,
      growth,
      months
    });
  } catch (error) {
    console.error("Failed to fetch MRR growth:", error);
    return NextResponse.json(
      { error: "Failed to fetch MRR growth" },
      { status: 500 }
    );
  }
}

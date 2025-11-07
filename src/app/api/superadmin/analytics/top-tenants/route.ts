import { NextRequest, NextResponse } from "next/server";
import { subscriptionAnalyticsService } from "@/services/subscription-analytics.service";

/**
 * GET /api/superadmin/analytics/top-tenants
 * Get top revenue-generating tenants
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const tenants = await subscriptionAnalyticsService.getTopRevenuegenants(limit);

    return NextResponse.json({
      success: true,
      tenants,
      limit
    });
  } catch (error) {
    console.error("Failed to fetch top tenants:", error);
    return NextResponse.json(
      { error: "Failed to fetch top tenants" },
      { status: 500 }
    );
  }
}

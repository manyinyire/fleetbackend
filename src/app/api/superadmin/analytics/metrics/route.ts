import { NextRequest, NextResponse } from "next/server";
import { subscriptionAnalyticsService } from "@/services/subscription-analytics.service";

/**
 * GET /api/superadmin/analytics/metrics
 * Get metrics for a date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end parameters are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const metrics = await subscriptionAnalyticsService.getMetricsForRange(
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      metrics,
      period: {
        start: start,
        end: end
      }
    });
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/analytics/metrics
 * Record daily metrics snapshot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const date = body.date ? new Date(body.date) : new Date();

    const metrics = await subscriptionAnalyticsService.recordDailyMetrics(date);

    return NextResponse.json({
      success: true,
      metrics,
      message: "Daily metrics recorded successfully"
    });
  } catch (error) {
    console.error("Failed to record metrics:", error);
    return NextResponse.json(
      { error: "Failed to record metrics" },
      { status: 500 }
    );
  }
}

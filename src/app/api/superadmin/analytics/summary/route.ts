import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { subscriptionAnalyticsService } from "@/services/subscription-analytics.service";

type RangeKey = "7d" | "30d" | "90d";

const RANGE_MAP: Record<RangeKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function resolveDateRange(rangeParam: string | null): { startDate: Date; endDate: Date; label: RangeKey } {
  const now = new Date();
  const sanitized = (rangeParam || "30d").toLowerCase() as RangeKey;
  const key = RANGE_MAP[sanitized] ? sanitized : ("30d" as RangeKey);

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - RANGE_MAP[key]);

  return { startDate, endDate: now, label: key };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const rangeParam = request.nextUrl.searchParams.get("range");
    const { startDate, endDate, label } = resolveDateRange(rangeParam);

    const [
      pageViews,
      uniqueUsers,
      signups,
      tenantCounts,
      payingTenants,
      trialsStarted,
      trialConversions,
      planDistributionRaw,
      topTenantsRaw,
      conversionMetrics,
    ] = await Promise.all([
      prisma.session.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.session.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        distinct: ["userId"],
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          tenantId: { not: null },
        },
      }),
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          plan: {
            not: "FREE",
          },
        },
      }),
      prisma.tenant.count({
        where: {
          isInTrial: true,
          trialStartDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.subscriptionHistory.count({
        where: {
          changeType: "TRIAL_END",
          effectiveDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.tenant.groupBy({
        by: ["plan"],
        _count: { plan: true },
      }),
      subscriptionAnalyticsService.getTopRevenuegenants(5),
      subscriptionAnalyticsService.calculateConversionMetrics(startDate, endDate),
    ]);

    const conversionRate = conversionMetrics.trialConversionRate;

    const funnelStages = [
      {
        stage: "Website Signups",
        value: signups,
        description: "New users registered in the selected period",
      },
      {
        stage: "Trials Started",
        value: trialsStarted,
        description: "Tenants currently in onboarding or trial",
      },
      {
        stage: "Trials Converted",
        value: trialConversions,
        description: "Trials converted to paying plans",
      },
      {
        stage: "Active Paying Tenants",
        value: payingTenants,
        description: "Customers on paid plans",
      },
    ];

    const planTotal = planDistributionRaw.reduce((acc, item) => acc + item._count.plan, 0) || 1;
    const planDistribution = planDistributionRaw.map((item) => ({
      plan: item.plan,
      count: item._count.plan,
      percentage: Number(((item._count.plan / planTotal) * 100).toFixed(2)),
    }));

    const topTenants = topTenantsRaw.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan,
      monthlyRevenue: tenant.monthlyRevenue,
      lifetimeValue: tenant.lifetimeValue,
      subscriptionStartDate: tenant.subscriptionStartDate,
    }));

    return NextResponse.json({
      success: true,
      data: {
        range: label,
        overview: {
          pageViews,
          uniqueUsers,
          signups,
          conversionRate: Number(conversionRate.toFixed(2)),
          totalTenants: tenantCounts,
        },
        conversions: {
          trialToBasic: conversionMetrics.trialToBasic,
          trialToPremium: conversionMetrics.trialToPremium,
          basicToPremium: conversionMetrics.basicToPremium,
          upgradeRate: conversionMetrics.upgradeRate,
        },
        planDistribution,
        topTenants,
        funnel: funnelStages,
      },
    });
  } catch (error) {
    console.error("Superadmin analytics summary error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics summary" },
      { status: 500 },
    );
  }
}


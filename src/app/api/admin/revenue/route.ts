import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { subscriptionAnalyticsService } from '@/services/subscription-analytics.service';

// GET /api/admin/revenue - Get revenue analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '12m';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Use new analytics service for accurate metrics
    const [revenueMetrics, churnMetrics, topTenants, revenueTrendData, revenueByPlan] = await Promise.all([
      subscriptionAnalyticsService.getRevenueMetrics(),
      subscriptionAnalyticsService.calculateChurnMetrics(startDate, now),
      subscriptionAnalyticsService.getTopRevenueTenants(10),
      subscriptionAnalyticsService.getMRRGrowth(12),
      subscriptionAnalyticsService.calculateRevenueByPlan()
    ]);

    // Get failed payments (suspended tenants)
    const failedPayments = await prisma.tenant.findMany({
      where: {
        status: 'SUSPENDED',
        suspendedAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        name: true,
        plan: true,
        monthlyRevenue: true,
        suspendedAt: true
      },
      orderBy: {
        suspendedAt: 'desc'
      },
      take: 10
    });

    // Calculate new and churned MRR
    const metricsData = await subscriptionAnalyticsService.getMetricsForRange(startDate, now);
    const latestMetrics = metricsData[metricsData.length - 1];

    const newMrr = latestMetrics ? Number(latestMetrics.newRevenue) : 0;
    const churnedMrr = churnMetrics.churnedRevenue;
    const netMrrGrowth = newMrr - churnedMrr;

    // Format revenue by plan
    const planRevenueData = [
      { plan: 'FREE', revenue: revenueByPlan.FREE, count: 0 },
      { plan: 'BASIC', revenue: revenueByPlan.BASIC, count: 0 },
      { plan: 'PREMIUM', revenue: revenueByPlan.PREMIUM, count: 0 }
    ];

    // Get plan counts
    const planCounts = await prisma.tenant.groupBy({
      by: ['plan'],
      _count: { id: true }
    });

    planCounts.forEach(({ plan, _count }) => {
      const planData = planRevenueData.find(p => p.plan === plan);
      if (planData) planData.count = _count.id;
    });

    // Format trend data
    const formattedTrendData = revenueTrendData.map(({ month, mrr }) => ({
      month,
      revenue: mrr,
      target: mrr * 1.1 // 10% growth target
    }));

    // Cohort data (simplified - showing retention trend)
    const cohortData = [
      { month: 'Recent', retention: 100, month1: Math.round(churnMetrics.retentionRate), month2: Math.round(churnMetrics.retentionRate * 0.95), month3: Math.round(churnMetrics.retentionRate * 0.92) }
    ];

    const revenueData = {
      metrics: {
        mrr: revenueMetrics.mrr,
        arr: revenueMetrics.arr,
        newMrr,
        churnedMrr,
        netMrrGrowth,
        arpu: revenueMetrics.arpu,
        ltv: revenueMetrics.ltv
      },
      planRevenueData,
      topRevenueTenants: topTenants,
      failedPayments,
      revenueTrendData: formattedTrendData,
      cohortData
    };

    return NextResponse.json(revenueData);

  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
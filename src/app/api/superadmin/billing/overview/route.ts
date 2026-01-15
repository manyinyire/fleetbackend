import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { subscriptionAnalyticsService } from '@/services/subscription-analytics.service';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const days = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get current metrics using new analytics service
    const [revenueMetrics, churnMetrics, planCounts] = await Promise.all([
      subscriptionAnalyticsService.getRevenueMetrics(),
      subscriptionAnalyticsService.calculateChurnMetrics(startDate, endDate),
      prisma.tenant.groupBy({
        by: ['plan'],
        _count: { plan: true }
      })
    ]);

    // Format plan distribution
    const planDistribution: Record<string, number> = {
      premium: 0,
      basic: 0,
      free: 0
    };

    let totalTenants = 0;
    planCounts.forEach(({ plan, _count }) => {
      const count = _count.plan;
      totalTenants += count;
      if (plan === 'PREMIUM') planDistribution.premium = count;
      else if (plan === 'BASIC') planDistribution.basic = count;
      else if (plan === 'FREE') planDistribution.free = count;
    });

    // Get new subscriptions in period
    const newSubscriptions = await prisma.tenant.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        plan: {
          in: ['BASIC', 'PREMIUM']
        }
      }
    });

    // Get MRR growth trend (use stored metrics for better performance)
    const metricsData = await subscriptionAnalyticsService.getMetricsForRange(
      startDate,
      endDate
    );

    // Format trend data for charts
    const revenueTrend = metricsData.map(metric => ({
      date: metric.date.toISOString().slice(0, 10),
      revenue: Number(metric.mrr),
      premiumTenants: metric.premiumCount,
      basicTenants: metric.basicCount
    }));

    // If no stored metrics, fall back to current calculation
    if (revenueTrend.length === 0) {
      revenueTrend.push({
        date: new Date().toISOString().slice(0, 10),
        revenue: revenueMetrics.mrr,
        premiumTenants: planDistribution.premium || 0,
        basicTenants: planDistribution.basic || 0
      });
    }

    const activeSubscriptions = (planDistribution.premium || 0) + (planDistribution.basic || 0);

    // Calculate revenue change safely
    let revenueChange = 0;
    if (revenueTrend.length > 1) {
      const firstTrend = revenueTrend[0];
      const lastTrend = revenueTrend[revenueTrend.length - 1];
      if (firstTrend && lastTrend && firstTrend.revenue > 0) {
        revenueChange = ((lastTrend.revenue - firstTrend.revenue) / firstTrend.revenue) * 100;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: revenueMetrics.mrr,
          revenueChange,
          activeSubscriptions,
          subscriptionsChange: newSubscriptions,
          churnRate: churnMetrics.churnRate,
          churnRateChange: 0,
          arpu: revenueMetrics.arpu,
          arr: revenueMetrics.arr
        },
        planDistribution: {
          premium: planDistribution.premium,
          basic: planDistribution.basic,
          free: planDistribution.free,
          total: totalTenants
        },
        revenueTrend,
        metrics: {
          mrr: revenueMetrics.mrr,
          arr: revenueMetrics.arr,
          arpu: revenueMetrics.arpu,
          ltv: revenueMetrics.ltv,
          churnRate: churnMetrics.churnRate,
          retentionRate: churnMetrics.retentionRate,
          newSubscriptions,
          cancelledTenants: churnMetrics.churnedCount,
          churnedRevenue: churnMetrics.churnedRevenue
        }
      }
    });

  } catch (error) {
    apiLogger.error({ err: error }, 'Billing overview error:');
    return NextResponse.json(
      { error: 'Failed to fetch billing overview' },
      { status: 500 }
    );
  }
}
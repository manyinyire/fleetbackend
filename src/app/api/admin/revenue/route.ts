import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/admin/revenue - Get revenue analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
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

    // Fetch revenue data
    const [
      totalRevenue,
      revenueByPlan,
      topRevenueTenants,
      failedPayments,
      revenueTrend,
      cohortData
    ] = await Promise.all([
      // Total Revenue (MRR)
      prisma.tenant.aggregate({
        _sum: {
          monthlyRevenue: true
        }
      }),
      
      // Revenue by Plan
      prisma.tenant.groupBy({
        by: ['plan'],
        _sum: {
          monthlyRevenue: true
        },
        _count: {
          id: true
        }
      }),
      
      // Top Revenue Tenants
      prisma.tenant.findMany({
        where: {
          status: 'ACTIVE',
          monthlyRevenue: {
            gt: 0
          }
        },
        select: {
          id: true,
          name: true,
          plan: true,
          monthlyRevenue: true,
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: {
          monthlyRevenue: 'desc'
        },
        take: 10
      }),
      
      // Failed Payments (suspended tenants)
      prisma.tenant.findMany({
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
      }),
      
      // Revenue Trend (monthly)
      prisma.tenant.findMany({
        select: {
          createdAt: true,
          plan: true,
          monthlyRevenue: true
        },
        where: {
          createdAt: {
            gte: startDate
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      
      // Cohort Data (placeholder - would need actual cohort analysis)
      Promise.resolve([
        { month: 'Jan 2024', retention: 100, month1: 92, month2: 87, month3: 84, month4: 82 },
        { month: 'Feb 2024', retention: 100, month1: 94, month2: 89, month3: 86, month4: 84 },
        { month: 'Mar 2024', retention: 100, month1: 91, month2: 85, month3: 81 },
        { month: 'Apr 2024', retention: 100, month1: 93, month2: 88 }
      ])
    ]);

    // Calculate metrics
    const mrr = Number(totalRevenue._sum.monthlyRevenue || 0);
    const arr = mrr * 12;
    const newMrr = mrr * 0.15; // Placeholder calculation
    const churnedMrr = mrr * 0.023; // 2.3% churn rate
    const netMrrGrowth = newMrr - churnedMrr;
    const arpu = mrr / Math.max(topRevenueTenants.length, 1);
    const ltv = arpu * 12;

    // Process revenue by plan data
    const planRevenueData = revenueByPlan.map(plan => ({
      plan: plan.plan,
      revenue: Number(plan._sum.monthlyRevenue || 0),
      count: plan._count.id
    }));

    // Process revenue trend data
    const monthlyRevenue = revenueTrend.reduce((acc, tenant) => {
      const month = tenant.createdAt.toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + Number(tenant.monthlyRevenue || 0);
      return acc;
    }, {} as Record<string, number>);

    const revenueTrendData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
      target: revenue * 1.1 // Placeholder target
    }));

    const revenueData = {
      metrics: {
        mrr,
        arr,
        newMrr,
        churnedMrr,
        netMrrGrowth,
        arpu,
        ltv
      },
      planRevenueData,
      topRevenueTenants,
      failedPayments,
      revenueTrendData,
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
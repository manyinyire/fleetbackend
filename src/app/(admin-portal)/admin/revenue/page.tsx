import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { RevenueDashboard } from '@/components/admin/revenue-dashboard';

export default async function RevenuePage() {
  await requireRole('SUPER_ADMIN');

  // Fetch revenue data
  const [
    totalRevenue,
    revenueByPlan,
    topRevenueTenants,
    failedPayments,
    revenueTrend,
    cohortData
  ] = await Promise.all([
    // Total Revenue (MRR) - placeholder
    Promise.resolve({ _sum: { monthlyRevenue: 0 } }),
    
    // Revenue by Plan - placeholder
    Promise.resolve([]),
    
    // Top Revenue Tenants - placeholder
    Promise.resolve([]),
    
    // Failed Payments (suspended tenants)
    prisma.tenant.findMany({
      where: {
        status: 'SUSPENDED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }),
    
    // Revenue Trend (last 12 months)
    prisma.tenant.findMany({
      select: {
        createdAt: true,
        plan: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    
    // Cohort Data (placeholder)
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
  const arpu = 0; // Placeholder
  const ltv = arpu * 12; // Simplified LTV calculation

  // Process revenue by plan data - placeholder
  const planRevenueData = [
    { plan: 'FREE', revenue: 0, count: 0 },
    { plan: 'BASIC', revenue: 0, count: 0 }
  ];

  // Process revenue trend data
  const monthlyRevenue = revenueTrend.reduce((acc, tenant) => {
    const month = tenant.createdAt.toISOString().substring(0, 7);
    const revenue = tenant.plan === 'BASIC' ? 25 : 0;
    acc[month] = (acc[month] || 0) + revenue;
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

  return <RevenueDashboard data={revenueData} />;
}

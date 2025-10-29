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
    cohortData,
    totalTenants
  ] = await Promise.all([
    // Total Revenue (MRR)
    prisma.tenant.aggregate({
      _sum: { monthlyRevenue: true }
    }),
    
    // Revenue by Plan
    prisma.tenant.groupBy({
      by: ['plan'],
      _sum: { monthlyRevenue: true },
      _count: { id: true }
    }),
    
    // Top Revenue Tenants
    prisma.tenant.findMany({
      orderBy: { monthlyRevenue: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        plan: true,
        monthlyRevenue: true,
        status: true
      }
    }),
    
    // Failed Payments (suspended tenants)
    prisma.tenant.findMany({
      where: {
        status: 'SUSPENDED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        plan: true,
        monthlyRevenue: true,
        updatedAt: true
      }
    }),
    
    // Cohort Data (placeholder - would need actual cohort analysis)
    Promise.resolve([]),
    
    // Total Tenants for ARPU calculation
    prisma.tenant.count()
  ]);

  // Calculate additional metrics
  const mrr = Number(totalRevenue._sum.monthlyRevenue) || 0;
  const newMrr = mrr * 0.15; // This would be calculated from new subscriptions
  const arpu = mrr / Math.max(totalTenants, 1); // Average Revenue Per User

  // Process revenue by plan data
  const planRevenueData = revenueByPlan.map(plan => ({
    plan: plan.plan,
    revenue: Number(plan._sum.monthlyRevenue) || 0,
    count: plan._count.id,
    percentage: ((Number(plan._sum.monthlyRevenue) || 0) / Math.max(mrr, 1)) * 100
  }));

  // Process top revenue tenants
  const topRevenueData = topRevenueTenants.map(tenant => ({
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    revenue: Number(tenant.monthlyRevenue),
    status: tenant.status
  }));

  // Process failed payments
  const failedPaymentsData = failedPayments.map(tenant => ({
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    amount: Number(tenant.monthlyRevenue),
    failedAt: tenant.updatedAt
  }));

  // Calculate revenue trends (placeholder - would need historical data)
  const revenueTrendData = [
    { month: 'Jan', revenue: mrr * 0.8 },
    { month: 'Feb', revenue: mrr * 0.85 },
    { month: 'Mar', revenue: mrr * 0.9 },
    { month: 'Apr', revenue: mrr * 0.95 },
    { month: 'May', revenue: mrr },
    { month: 'Jun', revenue: mrr * 1.05 }
  ];

  const revenueData = {
    metrics: {
      mrr,
      arr: mrr * 12,
      newMrr,
      churnedMrr: mrr * 0.05, // This would be calculated from actual churn
      netMrrGrowth: newMrr - (mrr * 0.05), // New MRR minus churned MRR
      arpu,
      ltv: arpu * 36 // 3 years average
    },
    planRevenueData,
    topRevenueTenants: topRevenueData,
    failedPayments: failedPaymentsData,
    revenueTrendData,
    cohortData: cohortData as any[],
    targets: {
      mrr: mrr * 1.1, // 10% growth target
      arr: mrr * 12 * 1.1,
      newMrr: newMrr * 1.2
    }
  };

  return <RevenueDashboard data={revenueData} />;
}
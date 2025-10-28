import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SuperAdminDashboard } from '@/components/admin/super-admin-dashboard';

export default async function AdminDashboardPage() {
  await requireRole('SUPER_ADMIN');

  // Fetch comprehensive platform data
  const [
    totalTenants,
    activeUsers,
    totalRevenue,
    recentSignups,
    paymentFailures,
    supportTickets,
    systemAlerts,
    revenueTrend,
    tenantGrowth
  ] = await Promise.all([
    // Total Tenants
    prisma.tenant.count(),
    
    // Active Users (last 30 days)
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Total Revenue (placeholder - would need to calculate from actual data)
    Promise.resolve({ _sum: { monthlyRevenue: 0 } }),
    
    // Recent Signups (last 5)
    prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    }),
    
    // Payment Failures (last 5)
    prisma.tenant.findMany({
      where: {
        status: 'SUSPENDED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    }),
    
    // Support Tickets (placeholder - would come from support system)
    Promise.resolve([]),
    
    // System Alerts (placeholder - would come from monitoring system)
    Promise.resolve([
      {
        id: '1',
        type: 'CRITICAL',
        title: 'High CPU usage on server-03',
        message: 'CPU usage at 94%',
        timestamp: new Date(),
        acknowledged: false
      },
      {
        id: '2',
        type: 'WARNING',
        title: 'Database backup delayed',
        message: 'Backup delayed by 2 hours',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        acknowledged: false
      },
      {
        id: '3',
        type: 'SUCCESS',
        title: 'Payments processed successfully',
        message: 'Processed 1,247 payments today',
        timestamp: new Date(),
        acknowledged: true
      }
    ]),
    
    // Revenue Trend (last 6 months)
    prisma.tenant.findMany({
      select: {
        createdAt: true,
        plan: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    
    // Tenant Growth (last 12 months)
    prisma.tenant.findMany({
      select: {
        createdAt: true,
        plan: true,
        status: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  // Calculate KPIs
  const mrr = 0; // Placeholder - would calculate from actual data
  const arr = mrr * 12;
  const churnRate = 2.3; // Placeholder - would calculate from actual data
  
  // Process revenue trend data
  const monthlyRevenue = revenueTrend.reduce((acc, tenant) => {
    const month = tenant.createdAt.toISOString().substring(0, 7);
    // Use plan-based revenue calculation since monthlyRevenue field doesn't exist
    const revenue = tenant.plan === 'BASIC' ? 25 : 0;
    acc[month] = (acc[month] || 0) + revenue;
    return acc;
  }, {} as Record<string, number>);

  const revenueTrendData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue,
    target: revenue * 1.1 // Placeholder target
  }));

  // Process tenant growth data
  const monthlyGrowth = tenantGrowth.reduce((acc, tenant) => {
    const month = tenant.createdAt.toISOString().substring(0, 7);
    if (!acc[month]) {
      acc[month] = { free: 0, basic: 0, premium: 0, total: 0 };
    }
    const planKey = tenant.plan.toLowerCase() as 'free' | 'basic';
    if (planKey in acc[month]) {
      acc[month][planKey]++;
    }
    acc[month].total++;
    return acc;
  }, {} as Record<string, { free: number; basic: number; premium: number; total: number }>);

  const tenantGrowthData = Object.entries(monthlyGrowth).map(([month, data]) => ({
    month,
    ...data
  }));

  const dashboardData = {
    kpis: {
      totalTenants,
      activeUsers,
      mrr,
      arr,
      churnRate,
      newMrr: mrr * 0.15, // Placeholder
      arpu: totalTenants > 0 ? mrr / totalTenants : 0,
      ltv: totalTenants > 0 ? (mrr / totalTenants) * 12 : 0
    },
    recentSignups,
    paymentFailures,
    supportTickets,
    systemAlerts,
    revenueTrendData,
    tenantGrowthData
  };

  return <SuperAdminDashboard data={dashboardData} />;
}
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SuperAdminDashboard } from "@/components/admin/super-admin-dashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stack } from "@chakra-ui/react";

export default async function AdminDashboardPage() {
  await requireRole("SUPER_ADMIN");

  // Fetch all dashboard data in parallel
  const [
    totalTenants,
    totalUsers,
    activeTenants,
    recentSignups,
    paymentFailures,
    totalRevenue,
    supportTickets,
    systemAlerts
  ] = await Promise.all([
    // Total Tenants
    prisma.tenant.count(),
    
    // Total Users
    prisma.user.count(),
    
    // Active Tenants
    prisma.tenant.count({
      where: { status: 'ACTIVE' }
    }),
    
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
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    }),
    
    // Total Revenue (MRR)
    prisma.tenant.aggregate({
      _sum: { monthlyRevenue: true }
    }),
    
    // Support Tickets (using suspended tenants as proxy)
    prisma.tenant.findMany({
      where: { status: 'SUSPENDED' },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    }),
    
    // System Alerts (using recent audit logs as proxy)
    prisma.auditLog.findMany({
      where: {
        action: { contains: 'ERROR' },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  ]);

  // Calculate additional metrics
  const mrr = Number(totalRevenue._sum.monthlyRevenue) || 0;
  const churnRate = 2.3; // This would be calculated from actual churn data
  const newMrr = mrr * 0.15; // This would be calculated from new subscriptions

  // Prepare dashboard data
  const dashboardData = {
    // KPI Cards
    kpis: {
      totalTenants,
      activeUsers: totalUsers,
      mrr,
      arr: mrr * 12,
      churnRate,
      newMrr,
      arpu: mrr / Math.max(totalTenants, 1),
      ltv: (mrr / Math.max(totalTenants, 1)) * 36 // 3 years average
    },
    
    // Revenue Metrics
    revenue: {
      mrr,
      arr: mrr * 12,
      newMrr,
      churnRate,
      growthRate: 12.5 // This would be calculated from historical data
    },
    
    // Recent Activity
    recentSignups: recentSignups.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      plan: tenant.plan,
      users: tenant._count.users,
      createdAt: tenant.createdAt
    })),
    
    paymentFailures: paymentFailures.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      plan: tenant.plan,
      users: tenant._count.users,
      suspendedAt: tenant.updatedAt
    })),
    
    supportTickets: supportTickets.map(tenant => ({
      id: tenant.id,
      title: `Suspended: ${tenant.name}`,
      status: 'open',
      priority: 'high',
      createdAt: tenant.updatedAt
    })),
    
    systemAlerts: systemAlerts.map(alert => ({
      id: alert.id,
      type: 'ERROR',
      title: `Error: ${alert.action}`,
      message: alert.details || 'System error detected',
      timestamp: alert.createdAt,
      acknowledged: false
    })),
    
    // Revenue trend data (placeholder - would need historical data)
    revenueTrendData: [
      { month: 'Jan', revenue: mrr * 0.8 },
      { month: 'Feb', revenue: mrr * 0.85 },
      { month: 'Mar', revenue: mrr * 0.9 },
      { month: 'Apr', revenue: mrr * 0.95 },
      { month: 'May', revenue: mrr },
      { month: 'Jun', revenue: mrr * 1.05 }
    ],
    
    // Tenant growth data (placeholder - would need historical data)
    tenantGrowthData: [
      { month: 'Jan', count: Math.floor(totalTenants * 0.8) },
      { month: 'Feb', count: Math.floor(totalTenants * 0.85) },
      { month: 'Mar', count: Math.floor(totalTenants * 0.9) },
      { month: 'Apr', count: Math.floor(totalTenants * 0.95) },
      { month: 'May', count: totalTenants },
      { month: 'Jun', count: Math.floor(totalTenants * 1.05) }
    ]
  };

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Super Admin Dashboard"
        description="Platform overview and system health monitoring"
      />
      <SuperAdminDashboard data={dashboardData} />
    </Stack>
  );
}
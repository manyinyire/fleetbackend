import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    // Get current date and previous month for comparison
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel with minimal queries
    const [
      tenantsByStatus,
      tenantsByPlan,
      tenantsLastMonth,
      usersByRole,
      usersLastMonth,
      cancelledThisMonth,
      cancelledLastMonth
    ] = await Promise.all([
      // Group tenants by status
      prisma.tenant.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      // Group tenants by plan
      prisma.tenant.groupBy({
        by: ['plan'],
        _count: { plan: true }
      }),
      // Count tenants created before this month
      prisma.tenant.count({
        where: { createdAt: { lt: thisMonth } }
      }),
      // Group users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        where: { tenantId: { not: null } }
      }),
      // Count users created before this month
      prisma.user.count({
        where: {
          createdAt: { lt: thisMonth },
          tenantId: { not: null }
        }
      }),
      // Count cancelled this month
      prisma.tenant.count({
        where: {
          status: 'CANCELED',
          updatedAt: { gte: thisMonth }
        }
      }),
      // Count cancelled last month
      prisma.tenant.count({
        where: {
          status: 'CANCELED',
          updatedAt: { gte: lastMonthStart, lte: lastMonthEnd }
        }
      })
    ]);

    // Process tenant stats
    const statusMap = tenantsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const planMap = tenantsByPlan.reduce((acc, item) => {
      acc[item.plan] = item._count.plan;
      return acc;
    }, {} as Record<string, number>);

    const totalTenants = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
    const activeTenants = statusMap['ACTIVE'] || 0;
    const trialTenants = planMap['FREE'] || 0;
    const cancelledTenants = statusMap['CANCELED'] || 0;
    const premiumTenants = planMap['PREMIUM'] || 0;
    const basicTenants = planMap['BASIC'] || 0;

    // Process user stats
    const totalUsers = usersByRole.reduce((sum, item) => sum + item._count.role, 0);
    const superAdmins = usersByRole.find(item => item.role === 'SUPER_ADMIN')?._count.role || 0;

    // Calculate MRR
    const mrr = (premiumTenants * 60) + (basicTenants * 15);
    
    // Estimate last month's MRR (simplified - assumes no plan changes)
    const lastMonthMRR = mrr > 0 ? mrr * 0.95 : 0; // Rough estimate

    // Calculate churn rate
    const churnRate = totalTenants > 0 ? (cancelledThisMonth / totalTenants) * 100 : 0;
    const lastMonthChurnRate = tenantsLastMonth > 0 ? (cancelledLastMonth / tenantsLastMonth) * 100 : 0;

    // Calculate growth percentages
    const tenantGrowth = tenantsLastMonth > 0 ? 
      ((totalTenants - tenantsLastMonth) / tenantsLastMonth) * 100 : 0;
    const userGrowth = usersLastMonth > 0 ? 
      ((totalUsers - usersLastMonth) / usersLastMonth) * 100 : 0;
    const mrrGrowth = lastMonthMRR > 0 ? 
      ((mrr - lastMonthMRR) / lastMonthMRR) * 100 : 0;
    const churnChange = lastMonthChurnRate - churnRate;

    return NextResponse.json({
      success: true,
      data: {
        totalTenants: {
          value: totalTenants,
          change: Math.round(tenantGrowth * 10) / 10,
          trend: tenantGrowth >= 0 ? 'up' : 'down'
        },
        activeUsers: {
          value: totalUsers,
          change: Math.round(userGrowth * 10) / 10,
          trend: userGrowth >= 0 ? 'up' : 'down'
        },
        mrr: {
          value: mrr,
          change: Math.round(mrrGrowth * 10) / 10,
          trend: mrrGrowth >= 0 ? 'up' : 'down'
        },
        churnRate: {
          value: Math.round(churnRate * 10) / 10,
          change: Math.round(churnChange * 10) / 10,
          trend: churnChange <= 0 ? 'up' : 'down'
        },
        additionalStats: {
          activeTenants,
          trialTenants,
          cancelledTenants,
          totalUsers,
          superAdmins,
          suspendedUsers: 0
        }
      }
    });

  } catch (error) {
    apiLogger.error({ err: error }, 'Dashboard stats error:');
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
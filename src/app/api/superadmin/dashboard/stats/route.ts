import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    // Get current date and previous month for comparison
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get tenant statistics
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({
      where: { status: 'ACTIVE' }
    });
    const trialTenants = await prisma.tenant.count({
      where: { plan: 'FREE' }
    });
    const cancelledTenants = await prisma.tenant.count({
      where: { status: 'CANCELED' }
    });

    // Get tenant count from last month for growth calculation
    const lastMonthTenants = await prisma.tenant.count({
      where: {
        createdAt: {
          lt: thisMonth
        }
      }
    });

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { tenantId: { not: null } }
    });
    const superAdmins = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' }
    });
    const suspendedUsers = await prisma.user.count({
      where: { 
        tenantId: { not: null },
        // Add suspended status logic here if you have it
      }
    });

    // Calculate user growth
    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: { lt: thisMonth },
        tenantId: { not: null }
      }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    // This is a simplified calculation - you might want to implement proper subscription billing
    const premiumTenants = await prisma.tenant.count({
      where: { plan: 'PREMIUM' }
    });
    const basicTenants = await prisma.tenant.count({
      where: { plan: 'BASIC' }
    });
    
    // Assuming pricing: Premium = $60/month, Basic = $15/month
    const mrr = (premiumTenants * 60) + (basicTenants * 15);
    
    // Calculate previous month MRR
    const lastMonthPremiumTenants = await prisma.tenant.count({
      where: { 
        plan: 'PREMIUM',
        createdAt: { lt: thisMonth }
      }
    });
    const lastMonthBasicTenants = await prisma.tenant.count({
      where: { 
        plan: 'BASIC',
        createdAt: { lt: thisMonth }
      }
    });
    const lastMonthMRR = (lastMonthPremiumTenants * 60) + (lastMonthBasicTenants * 15);

    // Calculate churn rate (simplified)
    const cancelledThisMonth = await prisma.tenant.count({
      where: {
        status: 'CANCELED',
        updatedAt: {
          gte: thisMonth
        }
      }
    });
    const churnRate = totalTenants > 0 ? (cancelledThisMonth / totalTenants) * 100 : 0;

    // Calculate previous month churn for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthCancelled = await prisma.tenant.count({
      where: {
        status: 'CANCELED',
        updatedAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    });
    const lastMonthChurnRate = lastMonthTenants > 0 ? (lastMonthCancelled / lastMonthTenants) * 100 : 0;

    // Calculate growth percentages
    const tenantGrowth = lastMonthTenants > 0 ? 
      ((totalTenants - lastMonthTenants) / lastMonthTenants) * 100 : 0;
    const userGrowth = lastMonthUsers > 0 ? 
      ((activeUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;
    const mrrGrowth = lastMonthMRR > 0 ? 
      ((mrr - lastMonthMRR) / lastMonthMRR) * 100 : 0;
    const churnChange = lastMonthChurnRate - churnRate; // Negative is good

    return NextResponse.json({
      success: true,
      data: {
        totalTenants: {
          value: totalTenants,
          change: tenantGrowth,
          trend: tenantGrowth >= 0 ? 'up' : 'down'
        },
        activeUsers: {
          value: activeUsers,
          change: userGrowth,
          trend: userGrowth >= 0 ? 'up' : 'down'
        },
        mrr: {
          value: mrr,
          change: mrrGrowth,
          trend: mrrGrowth >= 0 ? 'up' : 'down'
        },
        churnRate: {
          value: churnRate,
          change: churnChange,
          trend: churnChange <= 0 ? 'up' : 'down' // Lower churn is better
        },
        additionalStats: {
          activeTenants,
          trialTenants,
          cancelledTenants,
          totalUsers,
          superAdmins,
          suspendedUsers
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
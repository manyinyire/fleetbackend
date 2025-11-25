import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '12'; // months
    const months = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    // Get revenue trend data
    const revenueData = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Count tenants by plan for this month
      const premiumTenants = await prisma.tenant.count({
        where: {
          plan: 'PREMIUM',
          createdAt: { lte: monthEnd }
        }
      });
      const basicTenants = await prisma.tenant.count({
        where: {
          plan: 'BASIC',
          createdAt: { lte: monthEnd }
        }
      });

      const revenue = (premiumTenants * 60) + (basicTenants * 15);

      revenueData.push({
        date: monthStart.toISOString(),
        revenue,
        premiumTenants,
        basicTenants
      });
    }

    // Get tenant growth data
    const tenantGrowthData = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Count new tenants in this month
      const newTenants = await prisma.tenant.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      // Count total tenants up to this month
      const totalTenants = await prisma.tenant.count({
        where: {
          createdAt: { lte: monthEnd }
        }
      });

      // Count tenants by plan at this point in time
      const freeAtDate = await prisma.tenant.count({
        where: {
          plan: 'FREE',
          createdAt: { lte: monthEnd }
        }
      });
      const basicAtDate = await prisma.tenant.count({
        where: {
          plan: 'BASIC',
          createdAt: { lte: monthEnd }
        }
      });
      const premiumAtDate = await prisma.tenant.count({
        where: {
          plan: 'PREMIUM',
          createdAt: { lte: monthEnd }
        }
      });

      tenantGrowthData.push({
        date: monthStart.toISOString(),
        free: freeAtDate,
        basic: basicAtDate,
        premium: premiumAtDate,
        total: totalTenants
      });
    }

    // Get plan distribution
    const planDistribution = await prisma.tenant.groupBy({
      by: ['plan'],
      _count: {
        plan: true
      }
    });

    // Get status distribution
    const statusDistribution = await prisma.tenant.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        revenueTrend: revenueData,
        tenantGrowth: tenantGrowthData,
        planDistribution: planDistribution.map(item => ({
          plan: item.plan,
          count: item._count.plan
        })),
        statusDistribution: statusDistribution.map(item => ({
          status: item.status,
          count: item._count.status
        }))
      }
    });

  } catch (error) {
    apiLogger.error({ err: error }, 'Dashboard charts error:');
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  } finally {
  }
}
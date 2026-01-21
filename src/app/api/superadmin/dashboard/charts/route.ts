import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';

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

    // Fetch ALL tenants once with their creation dates and plans
    const allTenants = await prisma.tenant.findMany({
      select: {
        createdAt: true,
        plan: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Process data in memory instead of multiple DB queries
    const revenueData = [];
    const tenantGrowthData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Filter tenants created up to this month end
      const tenantsUpToDate = allTenants.filter(t => new Date(t.createdAt) <= monthEnd);
      
      // Count by plan
      const premiumTenants = tenantsUpToDate.filter(t => t.plan === 'PREMIUM').length;
      const basicTenants = tenantsUpToDate.filter(t => t.plan === 'BASIC').length;
      const freeTenants = tenantsUpToDate.filter(t => t.plan === 'FREE').length;

      const revenue = (premiumTenants * 60) + (basicTenants * 15);

      revenueData.push({
        date: monthStart.toISOString(),
        revenue,
        premiumTenants,
        basicTenants
      });

      tenantGrowthData.push({
        date: monthStart.toISOString(),
        free: freeTenants,
        basic: basicTenants,
        premium: premiumTenants,
        total: tenantsUpToDate.length
      });
    }

    // Get current plan and status distribution
    const planDistribution = allTenants.reduce((acc, tenant) => {
      acc[tenant.plan] = (acc[tenant.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution = allTenants.reduce((acc, tenant) => {
      acc[tenant.status] = (acc[tenant.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        revenueTrend: revenueData,
        tenantGrowth: tenantGrowthData,
        planDistribution: Object.entries(planDistribution).map(([plan, count]) => ({
          plan,
          count
        })),
        statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
          status,
          count
        }))
      }
    });

  } catch (error) {
    apiLogger.error({ err: error }, 'Dashboard charts error:');
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
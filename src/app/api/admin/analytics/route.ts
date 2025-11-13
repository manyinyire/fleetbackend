import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/admin/analytics - Get platform analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;

    if (!session?.user || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

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
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch analytics data
    const [
      totalUsers,
      totalTenants,
      activeUsers,
      newUsers,
      newTenants,
      userGrowthData,
      tenantActivityData,
      featureUsageData,
      timeOfDayUsageData
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total tenants
      prisma.tenant.count(),
      
      // Active users (logged in within time range)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: startDate
          }
        }
      }),
      
      // New users in time range
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // New tenants in time range
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // User growth data (monthly)
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      
      // Tenant activity data
      prisma.tenant.findMany({
        select: {
          name: true,
          _count: {
            select: {
              users: true,
              drivers: true,
              vehicles: true
            }
          }
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      
      // Feature usage data (placeholder - would need actual usage tracking)
      Promise.resolve([
        { name: 'Fleet Management', usage: 85, color: '#3b82f6' },
        { name: 'Driver Management', usage: 92, color: '#10b981' },
        { name: 'Financial Reports', usage: 68, color: '#f59e0b' },
        { name: 'Notifications', usage: 76, color: '#ef4444' }
      ]),
      
      // Time of day usage (placeholder - would need actual login tracking)
      Promise.resolve([
        { hour: '6:00', logins: 12 },
        { hour: '7:00', logins: 45 },
        { hour: '8:00', logins: 89 },
        { hour: '9:00', logins: 120 },
        { hour: '10:00', logins: 95 },
        { hour: '11:00', logins: 78 },
        { hour: '12:00', logins: 65 }
      ])
    ]);

    // Process user growth data
    const monthlyGrowth = userGrowthData.reduce((acc, item) => {
      const month = item.createdAt.toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const userGrowthChartData = Object.entries(monthlyGrowth).map(([month, users]) => ({
      month,
      users
    }));

    // Process tenant activity data
    const tenantActivityChartData = tenantActivityData.map(tenant => ({
      tenant: tenant.name,
      activeDrivers: Math.floor(tenant._count.drivers * 0.8), // Placeholder calculation
      totalDrivers: tenant._count.drivers,
      vehicles: tenant._count.vehicles
    }));

    // Calculate growth rates
    const userGrowthRate = totalUsers > 0 ? ((newUsers / totalUsers) * 100) : 0;
    const tenantGrowthRate = totalTenants > 0 ? ((newTenants / totalTenants) * 100) : 0;

    const analyticsData = {
      metrics: {
        totalUsers,
        totalTenants,
        activeUsers,
        newUsers,
        newTenants,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        tenantGrowthRate: Math.round(tenantGrowthRate * 100) / 100,
        avgSessionTime: 23 // Placeholder
      },
      charts: {
        userGrowth: userGrowthChartData,
        tenantActivity: tenantActivityChartData,
        featureUsage: featureUsageData,
        timeOfDayUsage: timeOfDayUsageData
      }
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
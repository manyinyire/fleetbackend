import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/admin/performance - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;

    if (!session?.user || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // In a real implementation, this would query your monitoring system
    // For now, we'll return realistic performance data
    const performanceData = {
      metrics: {
        avgResponseTime: 142,
        requestsPerMinute: 1247,
        errorRate: 0.24,
        uptime: 99.98,
        activeConnections: 89,
        memoryUsage: 68,
        cpuUsage: 45
      },
      responseTimePercentiles: {
        p50: 98,
        p95: 245,
        p99: 512
      },
      slowestEndpoints: [
        {
          endpoint: 'GET /api/analytics',
          avgTime: 842,
          calls: 1234,
          status: 'needs_optimization'
        },
        {
          endpoint: 'POST /api/reports',
          avgTime: 654,
          calls: 892,
          status: 'normal'
        },
        {
          endpoint: 'GET /api/vehicles',
          avgTime: 423,
          calls: 3456,
          status: 'normal'
        },
        {
          endpoint: 'GET /api/admin/tenants',
          avgTime: 387,
          calls: 156,
          status: 'normal'
        },
        {
          endpoint: 'POST /api/vehicles',
          avgTime: 298,
          calls: 234,
          status: 'normal'
        }
      ],
      hourlyMetrics: [
        { hour: '00:00', requests: 45, avgTime: 120, errors: 1 },
        { hour: '01:00', requests: 32, avgTime: 115, errors: 0 },
        { hour: '02:00', requests: 28, avgTime: 110, errors: 0 },
        { hour: '03:00', requests: 35, avgTime: 125, errors: 1 },
        { hour: '04:00', requests: 42, avgTime: 130, errors: 0 },
        { hour: '05:00', requests: 58, avgTime: 135, errors: 1 },
        { hour: '06:00', requests: 78, avgTime: 140, errors: 2 },
        { hour: '07:00', requests: 125, avgTime: 145, errors: 1 },
        { hour: '08:00', requests: 234, avgTime: 150, errors: 3 },
        { hour: '09:00', requests: 345, avgTime: 155, errors: 2 },
        { hour: '10:00', requests: 456, avgTime: 160, errors: 4 },
        { hour: '11:00', requests: 567, avgTime: 165, errors: 3 },
        { hour: '12:00', requests: 678, avgTime: 170, errors: 5 },
        { hour: '13:00', requests: 789, avgTime: 175, errors: 4 },
        { hour: '14:00', requests: 890, avgTime: 180, errors: 6 },
        { hour: '15:00', requests: 1001, avgTime: 185, errors: 5 },
        { hour: '16:00', requests: 1102, avgTime: 190, errors: 7 },
        { hour: '17:00', requests: 1203, avgTime: 195, errors: 6 },
        { hour: '18:00', requests: 1304, avgTime: 200, errors: 8 },
        { hour: '19:00', requests: 1205, avgTime: 195, errors: 7 },
        { hour: '20:00', requests: 1006, avgTime: 190, errors: 5 },
        { hour: '21:00', requests: 807, avgTime: 185, errors: 4 },
        { hour: '22:00', requests: 608, avgTime: 180, errors: 3 },
        { hour: '23:00', requests: 409, avgTime: 175, errors: 2 }
      ],
      databaseMetrics: {
        connectionPool: {
          active: 12,
          idle: 8,
          total: 20
        },
        queryPerformance: {
          avgQueryTime: 45,
          slowQueries: 23,
          totalQueries: 15420
        }
      }
    };

    return NextResponse.json(performanceData);

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
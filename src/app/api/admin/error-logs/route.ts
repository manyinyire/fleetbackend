import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/admin/error-logs - Get error logs with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level') || '';
    const source = searchParams.get('source') || '';
    const tenant = searchParams.get('tenant') || '';
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

    // In a real implementation, this would query your logging system
    // For now, we'll return realistic mock data based on filters
    const mockErrors = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        level: 'ERROR',
        source: 'API',
        tenant: 'Doe Transport',
        message: 'Database connection timeout',
        count: 1,
        stackTrace: 'Error: Connection timeout\n    at Database.connect (/app/lib/db.js:45:12)'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        level: 'WARN',
        source: 'Queue',
        tenant: '-',
        message: 'Job retry attempt #3',
        count: 3,
        stackTrace: null
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        level: 'ERROR',
        source: 'Auth',
        tenant: 'ABC Fleet',
        message: 'Invalid authentication token',
        count: 5,
        stackTrace: 'Error: Invalid token\n    at Auth.verify (/app/lib/auth.js:23:8)'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        level: 'ERROR',
        source: 'Payment',
        tenant: 'XYZ Delivery',
        message: 'Payment gateway timeout',
        count: 2,
        stackTrace: 'Error: Gateway timeout\n    at Payment.process (/app/lib/payment.js:67:15)'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        level: 'INFO',
        source: 'System',
        tenant: '-',
        message: 'Scheduled maintenance completed',
        count: 1,
        stackTrace: null
      }
    ];

    // Filter errors based on parameters
    let filteredErrors = mockErrors.filter(error => {
      const matchesLevel = !level || error.level === level;
      const matchesSource = !source || error.source === source;
      const matchesTenant = !tenant || error.tenant.includes(tenant);
      const matchesTimeRange = error.timestamp >= startDate;
      
      return matchesLevel && matchesSource && matchesTenant && matchesTimeRange;
    });

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedErrors = filteredErrors.slice(skip, skip + limit);

    // Calculate stats
    const totalErrors = filteredErrors.length;
    const criticalErrors = filteredErrors.filter(e => e.level === 'ERROR').length;
    const warningErrors = filteredErrors.filter(e => e.level === 'WARN').length;
    const errorRate = 0.24; // Placeholder calculation

    const totalPages = Math.ceil(totalErrors / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      errors: paginatedErrors,
      pagination: {
        page,
        limit,
        totalCount: totalErrors,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats: {
        totalErrors,
        criticalErrors,
        warningErrors,
        errorRate
      }
    });

  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}
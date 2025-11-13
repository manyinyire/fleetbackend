import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/error-logs - Get error logs with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;

    if (!session?.user || session.user?.role !== 'SUPER_ADMIN') {
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

    // Build where clause for audit logs
    const auditLogWhere: any = {
      createdAt: { gte: startDate },
      action: {
        in: ['ERROR', 'WARNING', 'CRITICAL', 'LOGIN_FAILED', 'AUTH_ERROR', 'PAYMENT_ERROR', 'DB_ERROR']
      }
    };

    if (level) {
      // Map level to action patterns
      if (level === 'ERROR' || level === 'CRITICAL') {
        auditLogWhere.action = { in: ['ERROR', 'CRITICAL', 'AUTH_ERROR', 'PAYMENT_ERROR', 'DB_ERROR'] };
      } else if (level === 'WARN' || level === 'WARNING') {
        auditLogWhere.action = 'WARNING';
      } else if (level === 'INFO') {
        auditLogWhere.action = { notIn: ['ERROR', 'WARNING', 'CRITICAL'] };
      }
    }

    if (tenant) {
      // First find tenant by name
      const tenantRecord = await prisma.tenant.findFirst({
        where: { name: { contains: tenant, mode: 'insensitive' } }
      });
      if (tenantRecord) {
        auditLogWhere.tenantId = tenantRecord.id;
      } else {
        // If tenant not found, return empty results
        return NextResponse.json({
          errors: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          stats: {
            totalErrors: 0,
            criticalErrors: 0,
            warningErrors: 0,
            errorRate: 0
          }
        });
      }
    }

    // Fetch audit logs
    const [auditLogs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: auditLogWhere,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where: auditLogWhere })
    ]);

    // Fetch system alerts
    const systemAlertsWhere: any = {
      createdAt: { gte: startDate },
      severity: { in: ['CRITICAL', 'WARNING'] }
    };

    if (level === 'ERROR' || level === 'CRITICAL') {
      systemAlertsWhere.severity = 'CRITICAL';
    } else if (level === 'WARN' || level === 'WARNING') {
      systemAlertsWhere.severity = 'WARNING';
    }

    const systemAlerts = await prisma.systemAlert.findMany({
      where: systemAlertsWhere,
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 2) // Split limit between audit logs and alerts
    });

    // Transform audit logs to error log format
    const errorsFromAuditLogs = auditLogs.map(log => {
      const details = log.details as any || {};
      const tenantName = log.tenantId 
        ? 'Loading...' // Will be fetched separately if needed
        : '-';
      
      // Determine level from action
      let errorLevel = 'INFO';
      if (log.action.includes('ERROR') || log.action === 'CRITICAL') {
        errorLevel = 'ERROR';
      } else if (log.action === 'WARNING') {
        errorLevel = 'WARN';
      }

      // Determine source from entityType or action
      let errorSource = log.entityType || 'System';
      if (log.action.includes('AUTH')) errorSource = 'Auth';
      else if (log.action.includes('PAYMENT')) errorSource = 'Payment';
      else if (log.action.includes('DB')) errorSource = 'Database';
      else if (log.action.includes('API')) errorSource = 'API';

      return {
        id: log.id,
        timestamp: log.createdAt,
        level: errorLevel,
        source: errorSource,
        tenant: tenantName,
        message: log.action.replace(/_/g, ' '),
        count: 1,
        stackTrace: details.stackTrace || details.error || null
      };
    });

    // Transform system alerts to error log format
    const errorsFromAlerts = systemAlerts.map(alert => ({
      id: `alert-${alert.id}`,
      timestamp: alert.createdAt,
      level: alert.severity === 'CRITICAL' ? 'ERROR' : 'WARN',
      source: alert.type.replace(/_/g, ' '),
      tenant: '-',
      message: alert.message,
      count: 1,
      stackTrace: (alert.data as any)?.stackTrace || null
    }));

    // Combine and sort by timestamp
    const allErrors = [...errorsFromAuditLogs, ...errorsFromAlerts]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    // Filter by source if specified
    let filteredErrors = allErrors;
    if (source) {
      filteredErrors = allErrors.filter(e => 
        e.source.toLowerCase().includes(source.toLowerCase())
      );
    }

    // Fetch tenant names for errors that have tenantId
    const tenantIds = [...new Set(auditLogs.map(log => log.tenantId).filter(Boolean))];
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds as string[] } },
      select: { id: true, name: true }
    });

    const tenantMap = new Map(tenants.map(t => [t.id, t.name]));

    // Update tenant names in errors
    filteredErrors.forEach((error, index) => {
      const log = auditLogs[index];
      if (log?.tenantId && tenantMap.has(log.tenantId)) {
        error.tenant = tenantMap.get(log.tenantId)!;
      }
    });

    // Calculate stats
    const totalErrors = filteredErrors.length;
    const criticalErrors = filteredErrors.filter(e => e.level === 'ERROR').length;
    const warningErrors = filteredErrors.filter(e => e.level === 'WARN').length;
    
    // Calculate error rate (errors per hour)
    const hoursInRange = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const errorRate = hoursInRange > 0 ? (totalErrors / hoursInRange) : 0;

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      errors: filteredErrors,
      pagination: {
        page,
        limit,
        totalCount: totalCount + systemAlerts.length,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats: {
        totalErrors: totalCount + systemAlerts.length,
        criticalErrors,
        warningErrors,
        errorRate: Math.round(errorRate * 100) / 100
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
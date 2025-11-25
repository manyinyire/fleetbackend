import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    // Get database health
    const dbHealth = await checkDatabaseHealth();
    
    // Get system metrics (mock data for now - in production you'd get this from monitoring tools)
    const systemMetrics = {
      overall: {
        status: 'healthy',
        uptime: '99.9%',
        lastCheck: new Date().toISOString()
      },
      servers: [
        {
          id: 'web-1',
          name: 'Web Server 1',
          status: 'healthy',
          cpu: 45,
          memory: 67,
          disk: 23,
          uptime: '99.8%'
        },
        {
          id: 'db-1',
          name: 'Database Server',
          status: 'healthy',
          cpu: 32,
          memory: 78,
          disk: 45,
          uptime: '99.9%'
        },
        {
          id: 'api-1',
          name: 'API Gateway',
          status: 'warning',
          cpu: 85,
          memory: 92,
          disk: 34,
          uptime: '99.5%'
        }
      ],
      databases: [
        {
          id: 'postgres-main',
          name: 'PostgreSQL Main',
          status: 'healthy',
          connections: 45,
          queries: 1250,
          responseTime: 12,
          uptime: '99.9%'
        },
        {
          id: 'redis-cache',
          name: 'Redis Cache',
          status: 'healthy',
          connections: 23,
          queries: 3400,
          responseTime: 2,
          uptime: '99.8%'
        }
      ],
      services: [
        {
          id: 'auth-service',
          name: 'Authentication Service',
          status: 'healthy',
          responseTime: 45,
          errorRate: 0.1,
          uptime: '99.9%'
        },
        {
          id: 'payment-service',
          name: 'Payment Processing',
          status: 'healthy',
          responseTime: 120,
          errorRate: 0.3,
          uptime: '99.7%'
        },
        {
          id: 'notification-service',
          name: 'Notification Service',
          status: 'warning',
          responseTime: 200,
          errorRate: 2.1,
          uptime: '98.5%'
        }
      ],
      alerts: [
        {
          id: 'alert-1',
          type: 'warning',
          title: 'High CPU Usage',
          message: 'API Gateway server CPU usage is above 80%',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          id: 'alert-2',
          type: 'info',
          title: 'Scheduled Maintenance',
          message: 'Database maintenance scheduled for tonight',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        },
        {
          id: 'alert-3',
          type: 'critical',
          title: 'Service Degradation',
          message: 'Notification service error rate increased',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          status: 'active'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        ...systemMetrics,
        database: dbHealth
      }
    });

  } catch (error) {
    apiLogger.error({ err: error }, 'System health error:');
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    );
  } finally {
  }
}

async function checkDatabaseHealth() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get database statistics
    const [tenantCount, userCount, vehicleCount, driverCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.driver.count()
    ]);

    return {
      status: 'healthy',
      connection: 'connected',
      responseTime: 15, // Mock response time
      statistics: {
        tenants: tenantCount,
        users: userCount,
        vehicles: vehicleCount,
        drivers: driverCount
      }
    };
  } catch (error) {
    return {
      status: 'error',
      connection: 'disconnected',
      error: 'Database connection failed'
    };
  }
}
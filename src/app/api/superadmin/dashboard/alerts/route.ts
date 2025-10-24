import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    // Get recent audit logs that might indicate issues
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['LOGIN_FAILED', 'SYSTEM_ALERT', 'PAYMENT_FAILED', 'TENANT_SUSPENDED']
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get failed login attempts
    const failedLogins = await prisma.auditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get suspended tenants
    const suspendedTenants = await prisma.tenant.count({
      where: { status: 'SUSPENDED' }
    });

    // Get tenants with payment issues (simplified - you might want to implement proper payment tracking)
    const tenantsWithIssues = await prisma.tenant.count({
      where: {
        status: 'ACTIVE',
        // Add payment issue logic here
      }
    });

    // Generate alerts based on the data
    const alerts = [];

    // Critical alerts
    if (failedLogins > 10) {
      alerts.push({
        id: 'failed-logins',
        type: 'critical',
        title: 'High Failed Login Attempts',
        message: `${failedLogins} failed login attempts in the last 24 hours`,
        timestamp: new Date().toISOString(),
        action: 'Review security logs'
      });
    }

    if (suspendedTenants > 0) {
      alerts.push({
        id: 'suspended-tenants',
        type: 'warning',
        title: 'Suspended Tenants',
        message: `${suspendedTenants} tenants are currently suspended`,
        timestamp: new Date().toISOString(),
        action: 'Review tenant status'
      });
    }

    // System health alerts (mock data for now)
    alerts.push({
      id: 'system-health',
      type: 'info',
      title: 'System Health Check',
      message: 'All systems operating normally',
      timestamp: new Date().toISOString(),
      action: 'View details'
    });

    // Recent activity alerts
    if (recentLogs.length > 0) {
      alerts.push({
        id: 'recent-activity',
        type: 'info',
        title: 'Recent Activity',
        message: `${recentLogs.length} system events in the last 24 hours`,
        timestamp: new Date().toISOString(),
        action: 'View audit logs'
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary: {
          critical: alerts.filter(a => a.type === 'critical').length,
          warning: alerts.filter(a => a.type === 'warning').length,
          info: alerts.filter(a => a.type === 'info').length,
          total: alerts.length
        }
      }
    });

  } catch (error) {
    console.error('Dashboard alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
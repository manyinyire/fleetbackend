import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent audit logs for activity feed
    const recentActivities = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'TENANT_CREATED',
            'TENANT_UPDATED',
            'USER_CREATED',
            'USER_UPDATED',
            'PAYMENT_PROCESSED',
            'PAYMENT_FAILED',
            'LOGIN',
            'LOGOUT',
            'SETTINGS_UPDATED'
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Get recent tenant signups
    const recentSignups = await prisma.tenant.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        createdAt: true
      }
    });

    // Get recent payment failures (mock data for now)
    const paymentFailures = [
      {
        id: 'pf-1',
        tenant: 'ABC Transport',
        amount: 45.00,
        reason: 'Card declined',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'pf-2',
        tenant: 'XYZ Fleet',
        amount: 15.00,
        reason: 'Expired card',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Get recent support tickets (mock data for now)
    const supportTickets = [
      {
        id: 'st-1',
        tenant: 'Doe Transport Ltd',
        subject: 'Payment processing issue',
        status: 'open',
        priority: 'high',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'st-2',
        tenant: 'City Logistics',
        subject: 'Feature request',
        status: 'in_progress',
        priority: 'medium',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Format activity feed
    const activityFeed = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.action,
      user: activity.user?.name || 'System',
      description: getActivityDescription(activity.action, activity.entityType),
      timestamp: activity.createdAt.toISOString(),
      metadata: {
        entityType: activity.entityType,
        entityId: activity.entityId,
        ipAddress: activity.ipAddress
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        activityFeed,
        recentSignups,
        paymentFailures,
        supportTickets,
        summary: {
          totalActivities: activityFeed.length,
          newSignups: recentSignups.length,
          paymentFailures: paymentFailures.length,
          openTickets: supportTickets.filter(t => t.status === 'open').length
        }
      }
    });

  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function getActivityDescription(action: string, entityType: string): string {
  const descriptions: { [key: string]: string } = {
    'TENANT_CREATED': 'New tenant registered',
    'TENANT_UPDATED': 'Tenant information updated',
    'USER_CREATED': 'New user account created',
    'USER_UPDATED': 'User account updated',
    'PAYMENT_PROCESSED': 'Payment processed successfully',
    'PAYMENT_FAILED': 'Payment processing failed',
    'LOGIN': 'User logged in',
    'LOGOUT': 'User logged out',
    'SETTINGS_UPDATED': 'System settings updated'
  };

  return descriptions[action] || `${action} on ${entityType}`;
}
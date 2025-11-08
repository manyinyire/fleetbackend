import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/notifications - Get system notifications
export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    // Get system alerts from database
    const systemAlerts = await prisma.systemAlert.findMany({
      where: {
        resolved: false, // Only show unresolved alerts
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });

    // Transform to notification format
    const notifications = systemAlerts.map(alert => ({
      id: alert.id,
      type: alert.type.toLowerCase(),
      title: alert.title,
      message: alert.message,
      priority: alert.severity.toLowerCase(),
      status: alert.acknowledged ? 'read' : 'unread',
      createdAt: alert.createdAt,
      acknowledgedAt: alert.acknowledgedAt,
      acknowledgedBy: alert.acknowledgedBy,
    }));

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    // Require super admin role
    const session = await requireRole('SUPER_ADMIN');

    const body = await request.json();
    const { notificationIds, action } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    if (!['read', 'unread', 'resolve', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be read, unread, resolve, or delete' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'read') {
      await prisma.systemAlert.updateMany({
        where: { id: { in: notificationIds } },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: session.user?.id,
        },
      });
    } else if (action === 'unread') {
      await prisma.systemAlert.updateMany({
        where: { id: { in: notificationIds } },
        data: {
          acknowledged: false,
          acknowledgedAt: null,
          acknowledgedBy: null,
        },
      });
    } else if (action === 'resolve') {
      await prisma.systemAlert.updateMany({
        where: { id: { in: notificationIds } },
        data: {
          resolved: true,
          resolvedAt: new Date(),
        },
      });
    } else if (action === 'delete') {
      await prisma.systemAlert.deleteMany({
        where: { id: { in: notificationIds } },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Notifications ${action} successfully`,
      affectedCount: notificationIds.length
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
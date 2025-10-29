import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/admin/notifications - Get system notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock notifications data - in a real system, this would come from a notifications service
    const notifications = [
      {
        id: '1',
        type: 'system',
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance will occur on Sunday at 2:00 AM UTC',
        priority: 'info',
        status: 'unread',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        type: 'security',
        title: 'Multiple Failed Login Attempts',
        message: 'User john@example.com has 5 failed login attempts in the last hour',
        priority: 'warning',
        status: 'unread',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'billing',
        title: 'Payment Processing Issue',
        message: 'Payment gateway is experiencing delays. Some payments may be delayed.',
        priority: 'critical',
        status: 'read',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        type: 'feature',
        title: 'New Feature Available',
        message: 'Advanced reporting features are now available for Premium users',
        priority: 'info',
        status: 'read',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

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
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, action } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    if (!['read', 'unread', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be read, unread, or delete' },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the database
    // For now, we'll return a success response
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
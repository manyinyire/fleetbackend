import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.notification.count({ where });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get statistics
    const stats = {
      total,
      unread: await prisma.notification.count({
        where: { ...where, status: 'UNREAD' },
      }),
      read: await prisma.notification.count({
        where: { ...where, status: 'READ' },
      }),
      archived: await prisma.notification.count({
        where: { ...where, status: 'ARCHIVED' },
      }),
      byType: await prisma.notification.groupBy({
        by: ['type'],
        _count: true,
        where,
      }),
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole('SUPER_ADMIN');
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Determine recipients
    let userIds: string[] = [];

    if (data.recipients === 'all') {
      // Send to all users
      const users = await prisma.user.findMany({
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (data.recipients === 'admins') {
      // Send to all admins
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
        },
        select: { id: true },
      });
      userIds = admins.map((u) => u.id);
    } else if (data.recipients === 'tenants') {
      // Send to specific tenant's users
      if (!data.tenantIds || data.tenantIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Tenant IDs are required' },
          { status: 400 }
        );
      }
      const users = await prisma.user.findMany({
        where: {
          tenantId: { in: data.tenantIds },
        },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (data.recipients === 'users' && data.userIds) {
      // Send to specific users
      userIds = data.userIds;
    }

    // Create notifications
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        status: 'UNREAD',
        link: data.link,
        metadata: data.metadata || {},
      })),
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'NOTIFICATIONS_SENT',
        entityType: 'Notification',
        entityId: 'bulk',
        newValues: {
          title: data.title,
          recipients: data.recipients,
          count: userIds.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${userIds.length} notifications`,
      data: { count: userIds.length },
    });
  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole('SUPER_ADMIN');
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const bulkAction = searchParams.get('bulk');

    if (bulkAction === 'deleteOld') {
      // Delete notifications older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
          status: { in: ['READ', 'ARCHIVED'] },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'NOTIFICATIONS_BULK_DELETED',
          entityType: 'Notification',
          entityId: 'bulk',
          oldValues: {
            count: result.count,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.count} old notifications`,
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Notification deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

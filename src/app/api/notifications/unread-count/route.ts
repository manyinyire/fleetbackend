import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the current user
 */
export const GET = withTenantAuth(async ({ prisma, user }) => {
    try {
        const userId = user.id;
        
        const count = await prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });

        return successResponse({
            unreadCount: count,
        });
    } catch (error) {
        console.error('Error getting unread notification count:', error);
        return errorResponse('Failed to get unread count', 500);
    }
});

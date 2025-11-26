import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';

/**
 * DELETE /api/notifications/[id]
 * Delete a specific notification
 */
export const DELETE = withTenantAuth(async ({ prisma, userId, params }) => {
    try {
        const notificationId = params?.id as string;

        if (!notificationId) {
            return errorResponse('Notification ID is required', 400);
        }

        // Verify the notification belongs to the user before deleting
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            select: { userId: true },
        });

        if (!notification) {
            return errorResponse('Notification not found', 404);
        }

        if (notification.userId !== userId) {
            return errorResponse('Unauthorized to delete this notification', 403);
        }

        await prisma.notification.delete({
            where: { id: notificationId },
        });

        return successResponse({
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return errorResponse('Failed to delete notification', 500);
    }
});

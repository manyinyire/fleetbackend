import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { z } from 'zod';

const markAsReadSchema = z.object({
    notificationIds: z.array(z.string()).optional(),
    markAll: z.boolean().optional(),
});

/**
 * PATCH /api/notifications/mark-read
 * Mark one or more notifications as read
 */
export const PATCH = withTenantAuth(async ({ prisma, user, request }) => {
    try {
        const body = await request.json();
        const { notificationIds, markAll } = markAsReadSchema.parse(body);

        const userId = user.id;

        if (markAll) {
            // Mark all notifications as read for this user
            const result = await prisma.notification.updateMany({
                where: {
                    userId,
                    read: false,
                },
                data: {
                    read: true,
                    readAt: new Date(),
                },
            });

            return successResponse({
                message: 'All notifications marked as read',
                count: result.count,
            });
        }

        if (!notificationIds || notificationIds.length === 0) {
            return errorResponse('Either notificationIds or markAll must be provided', 400);
        }

        // Mark specific notifications as read
        const result = await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId, // Ensure user can only mark their own notifications
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });

        return successResponse({
            message: `${result.count} notification(s) marked as read`,
            count: result.count,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return errorResponse('Invalid request data', 400, error.errors);
        }
        console.error('Error marking notifications as read:', error);
        return errorResponse('Failed to mark notifications as read', 500);
    }
});

import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { invoiceReminderService } from '@/lib/invoice-reminder';

/**
 * POST /api/invoices/[id]/send-reminder
 * Manually send a reminder for a specific invoice
 */
export const POST = withTenantAuth(async ({ tenantId, user, params }) => {
    try {
        const invoiceId = params?.id as string;

        if (!invoiceId) {
            return errorResponse('Invoice ID is required', 400);
        }

        // Check if user is admin
        if (!user.role.includes('ADMIN') && !user.role.includes('SUPER_ADMIN')) {
            return errorResponse('Only admins can send invoice reminders', 403);
        }

        const result = await invoiceReminderService.sendManualReminder(invoiceId);

        if (!result.success) {
            return errorResponse(result.message, 400);
        }

        return successResponse({
            message: result.message,
        });
    } catch (error) {
        console.error('Error sending invoice reminder:', error);
        return errorResponse('Failed to send invoice reminder', 500);
    }
});

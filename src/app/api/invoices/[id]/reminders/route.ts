import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';

/**
 * GET /api/invoices/[id]/reminders
 * Get reminder history for a specific invoice
 */
export const GET = withTenantAuth(async ({ prisma, tenantId, params }) => {
    try {
        const invoiceId = params?.id as string;

        if (!invoiceId) {
            return errorResponse('Invoice ID is required', 400);
        }

        // Verify the invoice belongs to this tenant
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                tenantId,
            },
        });

        if (!invoice) {
            return errorResponse('Invoice not found', 404);
        }

        // Get all reminders for this invoice
        const reminders = await prisma.invoiceReminder.findMany({
            where: {
                invoiceId,
            },
            orderBy: {
                sentAt: 'desc',
            },
        });

        return successResponse({
            reminders,
            count: reminders.length,
        });
    } catch (error) {
        console.error('Error getting invoice reminders:', error);
        return errorResponse('Failed to get invoice reminders', 500);
    }
});

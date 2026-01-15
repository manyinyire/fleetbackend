import { withTenantAuth, successResponse } from '@/lib/api-middleware';
import { NextResponse } from 'next/server';

/**
 * GET /api/invoices/[id]/reminders
 * Get reminder history for a specific invoice
 */
export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
    try {
        // Extract invoice ID from URL path
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const invoiceId = pathParts[pathParts.indexOf('invoices') + 1];

        if (!invoiceId) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
        }

        // Verify the invoice belongs to this tenant
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                tenantId,
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
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
        return NextResponse.json({ error: 'Failed to get invoice reminders' }, { status: 500 });
    }
});

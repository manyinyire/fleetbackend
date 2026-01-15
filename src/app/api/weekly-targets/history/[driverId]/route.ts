import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { WeeklyTargetService } from '@/services/weekly-target.service';

/**
 * GET /api/weekly-targets/history/[driverId]
 * Get weekly target history for a specific driver
 */
export const GET = withTenantAuth(async ({ tenantId, request }) => {
    try {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const driverId = pathParts[pathParts.length - 1];

        if (!driverId) {
            return errorResponse('Driver ID is required', 400);
        }
        const limit = parseInt(url.searchParams.get('limit') || '10');

        const service = new WeeklyTargetService(tenantId);
        const history = await service.getDriverHistory(driverId, limit);

        return successResponse({
            history,
            count: history.length,
        });
    } catch (error) {
        console.error('Error getting driver weekly target history:', error);
        return errorResponse('Failed to get driver weekly target history', 500);
    }
});

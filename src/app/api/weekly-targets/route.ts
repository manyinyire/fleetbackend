import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { WeeklyTargetService } from '@/services/weekly-target.service';

/**
 * GET /api/weekly-targets
 * Get all weekly targets for the current week
 */
export const GET = withTenantAuth(async ({ tenantId, request }) => {
    try {
        const service = new WeeklyTargetService(tenantId);
        const targets = await service.getAllDriversWeekSummary();

        return successResponse({
            targets,
            count: targets.length,
        });
    } catch (error) {
        console.error('Error getting weekly targets:', error);
        return errorResponse('Failed to get weekly targets', 500);
    }
});

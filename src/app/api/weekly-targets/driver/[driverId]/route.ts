import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { WeeklyTargetService } from '@/services/weekly-target.service';

/**
 * GET /api/weekly-targets/driver/[driverId]
 * Get weekly target summary for a specific driver
 */
export const GET = withTenantAuth(async ({ tenantId, params }) => {
    try {
        const driverId = params?.driverId as string;

        if (!driverId) {
            return errorResponse('Driver ID is required', 400);
        }

        const service = new WeeklyTargetService(tenantId);
        const summary = await service.getDriverWeekSummary(driverId);

        if (!summary) {
            return errorResponse('No weekly target found for this driver', 404);
        }

        return successResponse(summary);
    } catch (error) {
        console.error('Error getting driver weekly target:', error);
        return errorResponse('Failed to get driver weekly target', 500);
    }
});

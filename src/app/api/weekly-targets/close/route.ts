import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { WeeklyTargetService } from '@/services/weekly-target.service';

/**
 * POST /api/weekly-targets/close
 * Manually close last week's targets (Admin only)
 */
export const POST = withTenantAuth(async ({ tenantId, user }) => {
    try {
        // Check if user is admin
        if (!user.role.includes('ADMIN') && !user.role.includes('SUPER_ADMIN')) {
            return errorResponse('Only admins can manually close weekly targets', 403);
        }

        const service = new WeeklyTargetService(tenantId);
        const closedTargets = await service.closeLastWeek();

        return successResponse({
            message: 'Weekly targets closed successfully',
            closedCount: closedTargets.length,
            targets: closedTargets,
        });
    } catch (error) {
        console.error('Error closing weekly targets:', error);
        return errorResponse('Failed to close weekly targets', 500);
    }
});

import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-middleware';
import { WeeklyTargetService } from '@/services/weekly-target.service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/cron/weekly-targets
 * Cron job to close last week's targets and prepare for new week
 * Should run every Sunday at midnight
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true },
    });

    const results = await Promise.all(
      tenants.map(async (tenant) => {
        const service = new WeeklyTargetService(tenant.id);
        try {
          const closed = await service.closeLastWeek();
          return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            closedCount: closed.length,
            success: true,
          };
        } catch (error) {
          console.error(`Error closing week for tenant ${tenant.id}:`, error);
          return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return successResponse({
      message: 'Weekly targets closed successfully',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weekly targets cron error:', error);
    return Response.json(
      {
        error: 'Failed to close weekly targets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

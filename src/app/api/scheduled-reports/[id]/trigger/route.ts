/**
 * Trigger Scheduled Report API
 * Manually trigger a scheduled report to run immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenant } from '@/lib/auth-helpers';
import { scheduledReportsQueue } from '@/lib/queue';
import { SubscriptionPlan } from '@prisma/client';
import { rateLimitByPlan } from '@/lib/rate-limit';

/**
 * POST /api/scheduled-reports/[id]/trigger
 * Manually trigger a scheduled report
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user);

    // Check if tenant has PREMIUM plan
    if (tenant.plan !== SubscriptionPlan.PREMIUM) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scheduled reports are only available for PREMIUM plan',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitResult = await rateLimitByPlan(
      request,
      tenant.plan,
      'report'
    );
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    const scheduledReport = await prisma.scheduledReport.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    });

    if (!scheduledReport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scheduled report not found',
        },
        { status: 404 }
      );
    }

    if (!scheduledReport.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot trigger inactive scheduled report',
        },
        { status: 400 }
      );
    }

    // Add job to queue to run immediately
    const job = await scheduledReportsQueue.add(
      'generate-report',
      {
        scheduledReportId: scheduledReport.id,
        tenantId: tenant.id,
      },
      {
        priority: 1, // High priority for manual triggers
        jobId: `manual-trigger-${scheduledReport.id}-${Date.now()}`,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Report generation triggered successfully',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error triggering scheduled report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger scheduled report',
      },
      { status: 500 }
    );
  }
}

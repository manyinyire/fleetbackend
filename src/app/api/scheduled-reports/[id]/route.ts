/**
 * Individual Scheduled Report API
 * Endpoints for managing a specific scheduled report
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenant } from '@/lib/auth-helpers';
import { scheduledReportsQueue } from '@/lib/queue';
import { SubscriptionPlan } from '@prisma/client';
import { rateLimitByPlan } from '@/lib/rate-limit';

/**
 * GET /api/scheduled-reports/[id]
 * Get a specific scheduled report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user);

    const scheduledReport = await prisma.scheduledReport.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
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

    return NextResponse.json({
      success: true,
      data: scheduledReport,
    });
  } catch (error) {
    console.error('Error fetching scheduled report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch scheduled report',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scheduled-reports/[id]
 * Update a scheduled report
 */
export async function PATCH(
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

    const body = await request.json();
    const {
      name,
      description,
      frequency,
      format,
      recipients,
      filters,
      isActive,
    } = body;

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

    // Update scheduled report
    const updated = await prisma.scheduledReport.update({
      where: { id: params.id },
      data: {
        name,
        description,
        frequency,
        format,
        recipients,
        filters,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update scheduled report',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scheduled-reports/[id]
 * Delete a scheduled report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user);

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

    // Delete scheduled report
    await prisma.scheduledReport.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete scheduled report',
      },
      { status: 500 }
    );
  }
}

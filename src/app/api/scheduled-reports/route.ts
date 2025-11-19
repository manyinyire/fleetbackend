/**
 * Scheduled Reports API
 * Endpoints for managing scheduled reports (PREMIUM feature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenant } from '@/lib/auth-helpers';
import { scheduledReportsQueue } from '@/lib/queue';
import { SubscriptionPlan, ReportType, ReportFrequency, ReportFormat } from '@prisma/client';
import { rateLimitByPlan } from '@/lib/rate-limit';

/**
 * GET /api/scheduled-reports
 * Get all scheduled reports for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenant();

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant context required' },
        { status: 403 }
      );
    }

    // Fetch tenant to check plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
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

    const scheduledReports = await prisma.scheduledReport.findMany({
      where: { tenantId: tenantId },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: scheduledReports,
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch scheduled reports',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduled-reports
 * Create a new scheduled report (PREMIUM only)
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireTenant();

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant context required' },
        { status: 403 }
      );
    }

    // Fetch tenant to check plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

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
      'api'
    );
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const {
      name,
      description,
      reportType,
      frequency,
      format,
      recipients,
      filters,
    } = body;

    // Validate required fields
    if (!name || !reportType || !frequency || !format || !recipients) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate report type
    if (!Object.values(ReportType).includes(reportType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid report type',
        },
        { status: 400 }
      );
    }

    // Validate frequency
    if (!Object.values(ReportFrequency).includes(frequency)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid frequency',
        },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = format.every((f: string) =>
      Object.values(ReportFormat).includes(f as ReportFormat)
    );
    if (!validFormats) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format',
        },
        { status: 400 }
      );
    }

    // Calculate next run time
    const nextRunAt = calculateNextRunTime(frequency, new Date());

    // Create scheduled report
    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        tenantId: tenantId,
        name,
        description,
        reportType,
        frequency,
        format,
        recipients,
        filters,
        nextRunAt,
        createdBy: user.id,
      },
    });

    // Schedule first job
    await scheduledReportsQueue.add(
      'generate-report',
      {
        scheduledReportId: scheduledReport.id,
        tenantId: tenantId,
      },
      {
        delay: nextRunAt.getTime() - Date.now(),
        jobId: `scheduled-report-${scheduledReport.id}-${nextRunAt.getTime()}`,
      }
    );

    return NextResponse.json({
      success: true,
      data: scheduledReport,
    });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create scheduled report',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(frequency: ReportFrequency, currentDate: Date): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case ReportFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case ReportFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case ReportFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
    case ReportFrequency.QUARTERLY:
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  // Set to 9 AM
  next.setHours(9, 0, 0, 0);

  return next;
}

/**
 * Report Export API
 * On-demand report generation and export in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenant } from '@/lib/auth-helpers';
import { rateLimitByPlan } from '@/lib/rate-limit';
import { reportGeneratorService } from '@/services/report-generator.service';
import { ReportType, ReportFormat } from '@prisma/client';
import { readFile } from 'fs/promises';

/**
 * POST /api/reports/export
 * Generate and export a report on-demand
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const tenant = await requireTenant(user);

    // Check rate limit based on tenant plan
    const rateLimitResult = await rateLimitByPlan(
      request,
      tenant.plan,
      'export'
    );
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const { reportType, format, filters } = body;

    // Validate report type
    if (!reportType || !Object.values(ReportType).includes(reportType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing report type',
        },
        { status: 400 }
      );
    }

    // Validate format
    if (!format || !Object.values(ReportFormat).includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing export format',
        },
        { status: 400 }
      );
    }

    // Generate report data
    const reportData = await reportGeneratorService.generateReport(
      tenant.id,
      reportType,
      filters
    );

    // Export report to specified format
    const fileUrls = await reportGeneratorService.exportReport(
      reportData,
      [format]
    );

    const fileUrl = fileUrls[format];

    // In production, you would upload to S3 and return the URL
    // For now, read the file and send as response
    try {
      const fileContent = await readFile(fileUrl);
      const mimeTypes = {
        [ReportFormat.PDF]: 'application/pdf',
        [ReportFormat.CSV]: 'text/csv',
        [ReportFormat.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      const extensions = {
        [ReportFormat.PDF]: 'pdf',
        [ReportFormat.CSV]: 'csv',
        [ReportFormat.EXCEL]: 'xlsx',
      };

      const filename = `${reportType.toLowerCase()}_${Date.now()}.${extensions[format]}`;

      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': mimeTypes[format],
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (fileError) {
      console.error('Error reading export file:', fileError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to read export file',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export report',
      },
      { status: 500 }
    );
  }
}

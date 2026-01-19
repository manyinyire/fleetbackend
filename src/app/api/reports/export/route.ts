import { NextRequest, NextResponse } from 'next/server';
import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { PremiumFeatureService } from '@/lib/premium-features';
import { reportGeneratorService } from '@/services/report-generator.service';
import { apiLogger } from '@/lib/logger';
import { ReportType } from '@prisma/client';

/**
 * POST /api/reports/export
 * Export reports to various formats (PDF, CSV, Excel)
 * Premium feature: Report export requires BASIC plan or higher
 */
export async function POST(request: NextRequest) {
  let reportType: string | undefined;
  let format: string | undefined;
  
  try {
    const { tenantId } = await requireTenantForDashboard();
    const body = await request.json();
    ({ reportType, format } = body);
    const { data } = body;

    // Check if tenant has access to report export
    const featureCheck = await PremiumFeatureService.hasFeatureAccess(
      tenantId,
      'reportExport'
    );

    if (!featureCheck.allowed) {
      return NextResponse.json(
        {
          error: featureCheck.reason,
          suggestedPlan: featureCheck.suggestedPlan,
          upgradeMessage: featureCheck.upgradeMessage,
        },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!reportType || !format) {
      return NextResponse.json(
        { error: 'Report type and format are required' },
        { status: 400 }
      );
    }

    // Validate report type
    if (!Object.values(ReportType).includes(reportType as ReportType)) {
      return NextResponse.json(
        { error: `Invalid report type: ${reportType}` },
        { status: 400 }
      );
    }

    // Generate report data
    const reportData = await reportGeneratorService.generateReport(
      tenantId,
      reportType as ReportType,
      data?.filters
    );

    apiLogger.info({ tenantId, reportType, format }, 'Generating report export');

    // Export to requested format
    let fileContent: Buffer;
    let contentType: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'pdf':
        fileContent = await generatePDFBuffer(reportData);
        contentType = 'application/pdf';
        filename = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        break;

      case 'csv':
        fileContent = Buffer.from(generateCSVString(reportData));
        contentType = 'text/csv';
        filename = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.csv`;
        break;

      case 'excel':
      case 'xlsx':
        fileContent = await generateExcelBuffer(reportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported format: ${format}. Use pdf, csv, or excel.` },
          { status: 400 }
        );
    }

    // Return file as download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', fileContent.length.toString());

    return new NextResponse(new Uint8Array(fileContent), {
      status: 200,
      headers,
    });

  } catch (error) {
    apiLogger.error({ err: error, reportType, format }, 'Report export failed');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export report' },
      { status: 500 }
    );
  }
}

// Helper functions for server-side export

function generateCSVString(data: { headers: string[]; rows: any[][] }): string {
  const rows = [
    data.headers.join(','),
    ...data.rows.map(row =>
      row.map(cell => {
        const str = String(cell ?? '');
        // Escape commas and quotes
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    )
  ];
  return rows.join('\n');
}

async function generatePDFBuffer(data: { title: string; headers: string[]; rows: any[][]; metadata?: Record<string, any> }): Promise<Buffer> {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(data.title, 14, 20);

  // Add metadata if present
  let startY = 30;
  if (data.metadata) {
    doc.setFontSize(10);
    const metadataLines: string[] = [];
    Object.entries(data.metadata).forEach(([key, value]) => {
      metadataLines.push(`${key}: ${value}`);
    });
    doc.text(metadataLines, 14, startY);
    startY += metadataLines.length * 5 + 5;
  }

  // Add table using autoTable
  (doc as any).autoTable({
    head: [data.headers],
    body: data.rows,
    startY,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { top: startY, left: 14, right: 14 },
  });

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

async function generateExcelBuffer(data: { title: string; headers: string[]; rows: any[][] }): Promise<Buffer> {
  const ExcelJS = await import('exceljs');

  const workbook = new ExcelJS.default.Workbook();
  const worksheet = workbook.addWorksheet(data.title.slice(0, 31)); // Excel limits sheet names to 31 chars

  // Add headers with styling
  worksheet.addRow(data.headers);
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  data.rows.forEach(row => {
    worksheet.addRow(row);
  });

  // Set column widths
  worksheet.columns = data.headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...data.rows.map(row => String(row[index] ?? '').length)
    );
    return { width: Math.min(maxLength + 2, 50) };
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Server-side Data Export Utilities
 * For generating exports in scheduled reports and API endpoints
 */

import ExcelJS from 'exceljs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface ExportableData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  includeHeaders?: boolean;
  styling?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

/**
 * Export to CSV (Server-side)
 */
export async function exportToCSVServer(
  data: ExportableData,
  filename?: string
): Promise<string> {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row =>
      row
        .map(cell =>
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        )
        .join(',')
    ),
  ].join('\n');

  const filepath = join(
    tmpdir(),
    filename || `export_${Date.now()}.csv`
  );

  await writeFile(filepath, csvContent, 'utf-8');

  return filepath;
}

/**
 * Export to Excel (Server-side)
 */
export async function exportToExcelServer(
  data: ExportableData,
  filename?: string
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

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

  const filepath = join(
    tmpdir(),
    filename || `export_${Date.now()}.xlsx`
  );

  await workbook.xlsx.writeFile(filepath);

  return filepath;
}

/**
 * Export to PDF (Server-side)
 */
export async function exportToPDFServer(
  data: ExportableData,
  filename?: string,
  options?: ExportOptions
): Promise<string> {
  // Dynamic imports to ensure jspdf-autotable is properly loaded
  const { jsPDF } = await import('jspdf');
  const { applyPlugin } = await import('jspdf-autotable');
  
  // Manually apply the plugin for server-side environments (required in v5.0.0+)
  applyPlugin(jsPDF);
  
  const doc = new jsPDF();

  // Add title
  if (data.title) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, 14, 22);
  }

  // Add subtitle
  if (data.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(data.subtitle, 14, data.title ? 30 : 22);
  }

  // Add metadata section
  let metadataY = data.title ? 38 : data.subtitle ? 30 : 22;
  if (data.metadata) {
    doc.setFontSize(8);
    doc.setTextColor(60);
    const metadataLines = Object.entries(data.metadata)
      .filter(([_, value]) => typeof value === 'string' || typeof value === 'number')
      .map(([key, value]) => `${key}: ${value}`);

    if (metadataLines.length > 0) {
      doc.text(metadataLines.join(' | '), 14, metadataY);
      metadataY += 8;
    }
  }

  // Add table
  const startY = metadataY + 5;

  const primaryColor = options?.styling?.primaryColor || '#3B82F6';
  const rgbColor = hexToRgb(primaryColor);

  // Check if autoTable is available
  if (typeof (doc as any).autoTable !== 'function') {
    throw new Error('jspdf-autotable plugin is not loaded. Please ensure jspdf-autotable is properly installed.');
  }

  (doc as any).autoTable({
    head: [data.headers],
    body: data.rows,
    startY: startY,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: rgbColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { top: startY, left: 14, right: 14, bottom: 20 },
    didDrawPage: (hookData: any) => {
      // Footer with page numbers
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageWidth = pageSize.width || pageSize.getWidth();

      doc.text(
        `Page ${hookData.pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        14,
        pageHeight - 10
      );
    },
  });

  const filepath = join(
    tmpdir(),
    filename || `export_${Date.now()}.pdf`
  );

  doc.save(filepath);

  return filepath;
}

/**
 * Generic server-side export function
 */
export async function exportDataServer(
  data: ExportableData,
  options: ExportOptions
): Promise<string> {
  const filename = options.filename || `export_${Date.now()}.${options.format}`;

  switch (options.format) {
    case 'csv':
      return await exportToCSVServer(data, filename);
    case 'excel':
      return await exportToExcelServer(data, filename);
    case 'pdf':
      return await exportToPDFServer(data, filename, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) {
    return [59, 130, 246];
  }
  return [
    parseInt(match[1]!, 16),
    parseInt(match[2]!, 16),
    parseInt(match[3]!, 16),
  ];
}

/**
 * Export multiple formats at once
 */
export async function exportMultipleFormats(
  data: ExportableData,
  formats: ('csv' | 'excel' | 'pdf')[],
  baseFilename?: string
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  for (const format of formats) {
    const filename = baseFilename
      ? `${baseFilename}.${format}`
      : undefined;

    const filepath = await exportDataServer(data, { format, filename });
    files[format] = filepath;
  }

  return files;
}

/**
 * Transform data helpers for common exports
 */
export function prepareReportData(
  title: string,
  headers: string[],
  rows: any[][],
  metadata?: Record<string, any>
): ExportableData {
  return {
    title,
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    headers,
    rows,
    metadata,
  };
}

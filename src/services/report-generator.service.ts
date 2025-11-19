/**
 * Report Generator Service
 * Generates reports in various formats (PDF, CSV, Excel) for scheduled reports
 */

import { prisma } from '@/lib/prisma';
import { exportToPDF, exportToCSV, exportToExcel } from '@/lib/export';
import { ReportType, ReportFormat, SubscriptionPlan } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subDays, subWeeks, subMonths, subQuarters } from 'date-fns';

interface ReportData {
  title: string;
  headers: string[];
  rows: any[][];
  metadata?: Record<string, any>;
}

export class ReportGeneratorService {
  /**
   * Generate a report based on type and filters
   */
  async generateReport(
    tenantId: string,
    reportType: ReportType,
    filters?: Record<string, any>
  ): Promise<ReportData> {
    switch (reportType) {
      case ReportType.FINANCIAL_SUMMARY:
        return this.generateFinancialSummary(tenantId, filters);
      case ReportType.VEHICLE_PERFORMANCE:
        return this.generateVehiclePerformance(tenantId, filters);
      case ReportType.DRIVER_PERFORMANCE:
        return this.generateDriverPerformance(tenantId, filters);
      case ReportType.MAINTENANCE_SUMMARY:
        return this.generateMaintenanceSummary(tenantId, filters);
      case ReportType.REMITTANCE_SUMMARY:
        return this.generateRemittanceSummary(tenantId, filters);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Export report to specified formats
   */
  async exportReport(
    data: ReportData,
    formats: ReportFormat[]
  ): Promise<Record<ReportFormat, string>> {
    const files: Record<string, string> = {};

    for (const format of formats) {
      switch (format) {
        case ReportFormat.PDF:
          files[format] = await this.exportToPDFFile(data);
          break;
        case ReportFormat.CSV:
          files[format] = await this.exportToCSVFile(data);
          break;
        case ReportFormat.EXCEL:
          files[format] = await this.exportToExcelFile(data);
          break;
      }
    }

    return files as Record<ReportFormat, string>;
  }

  /**
   * Financial Summary Report
   */
  private async generateFinancialSummary(
    tenantId: string,
    filters?: Record<string, any>
  ): Promise<ReportData> {
    const dateRange = this.getDateRange(filters);

    // Get remittances
    const remittances = await prisma.remittance.findMany({
      where: {
        tenantId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        driver: true,
        vehicle: true,
      },
      orderBy: { date: 'desc' },
    });

    // Get expenses (maintenance)
    const expenses = await prisma.maintenanceRecord.findMany({
      where: {
        tenantId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        vehicle: true,
      },
    });

    const totalRevenue = remittances.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.cost || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${totalRevenue.toFixed(2)}`],
      ['Total Expenses', `$${totalExpenses.toFixed(2)}`],
      ['Net Profit', `$${netProfit.toFixed(2)}`],
      ['Number of Remittances', remittances.length.toString()],
      ['Number of Expenses', expenses.length.toString()],
      [],
      ['Recent Remittances', ''],
      ['Date', 'Driver', 'Vehicle', 'Amount'],
      ...remittances.slice(0, 20).map(r => [
        new Date(r.date).toLocaleDateString(),
        r.driver.fullName,
        r.vehicle.registrationNumber,
        `$${Number(r.amount).toFixed(2)}`,
      ]),
    ];

    return {
      title: 'Financial Summary Report',
      headers: rows[0] as string[],
      rows: rows.slice(1),
      metadata: {
        dateRange,
        totalRevenue,
        totalExpenses,
        netProfit,
      },
    };
  }

  /**
   * Vehicle Performance Report
   */
  private async generateVehiclePerformance(
    tenantId: string,
    filters?: Record<string, any>
  ): Promise<ReportData> {
    const dateRange = this.getDateRange(filters);

    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
      include: {
        remittances: {
          where: {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        },
        maintenanceRecords: {
          where: {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        },
      },
    });

    const rows = [
      ['Vehicle', 'Registration', 'Status', 'Revenue', 'Maintenance Cost', 'Trips', 'Net Profit'],
      ...vehicles.map(v => {
        const revenue = v.remittances.reduce((sum, r) => sum + Number(r.amount), 0);
        const maintenanceCost = v.maintenanceRecords.reduce((sum, m) => sum + Number(m.cost || 0), 0);
        const trips = v.remittances.length;
        const netProfit = revenue - maintenanceCost;

        return [
          v.make + ' ' + v.model,
          v.registrationNumber,
          v.status,
          `$${revenue.toFixed(2)}`,
          `$${maintenanceCost.toFixed(2)}`,
          trips.toString(),
          `$${netProfit.toFixed(2)}`,
        ];
      }),
    ];

    return {
      title: 'Vehicle Performance Report',
      headers: rows[0] as string[],
      rows: rows.slice(1),
      metadata: { dateRange },
    };
  }

  /**
   * Driver Performance Report
   */
  private async generateDriverPerformance(
    tenantId: string,
    filters?: Record<string, any>
  ): Promise<ReportData> {
    const dateRange = this.getDateRange(filters);

    const drivers = await prisma.driver.findMany({
      where: { tenantId },
      include: {
        remittances: {
          where: {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        },
      },
    });

    const rows = [
      ['Driver', 'Phone', 'Status', 'Total Remittances', 'Average Per Trip', 'Trip Count'],
      ...drivers.map(d => {
        const totalRevenue = d.remittances.reduce((sum, r) => sum + Number(r.amount), 0);
        const tripCount = d.remittances.length;
        const avgPerTrip = tripCount > 0 ? totalRevenue / tripCount : 0;

        return [
          d.fullName,
          d.phone || 'N/A',
          d.status,
          `$${totalRevenue.toFixed(2)}`,
          `$${avgPerTrip.toFixed(2)}`,
          tripCount.toString(),
        ];
      }),
    ];

    return {
      title: 'Driver Performance Report',
      headers: rows[0] as string[],
      rows: rows.slice(1),
      metadata: { dateRange },
    };
  }

  /**
   * Maintenance Summary Report
   */
  private async generateMaintenanceSummary(
    tenantId: string,
    filters?: Record<string, any>
  ): Promise<ReportData> {
    const dateRange = this.getDateRange(filters);

    const maintenance = await prisma.maintenanceRecord.findMany({
      where: {
        tenantId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
    });

    const rows = [
      ['Date', 'Vehicle', 'Type', 'Description', 'Cost'],
      ...maintenance.map((m: any) => [
        new Date(m.date).toLocaleDateString(),
        m.vehicle.registrationNumber,
        m.type,
        m.description || 'N/A',
        `$${Number(m.cost || 0).toFixed(2)}`,
      ]),
    ];

    const totalCost = maintenance.reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0);

    return {
      title: 'Maintenance Summary Report',
      headers: rows[0] as string[],
      rows: rows.slice(1),
      metadata: {
        dateRange,
        totalCost,
        recordCount: maintenance.length,
      },
    };
  }

  /**
   * Remittance Summary Report
   */
  private async generateRemittanceSummary(
    tenantId: string,
    filters?: Record<string, any>
  ): Promise<ReportData> {
    const dateRange = this.getDateRange(filters);

    const remittances = await prisma.remittance.findMany({
      where: {
        tenantId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        driver: true,
        vehicle: true,
      },
      orderBy: { date: 'desc' },
    });

    const rows = [
      ['Date', 'Driver', 'Vehicle', 'Amount', 'Status', 'Notes'],
      ...remittances.map(r => [
        new Date(r.date).toLocaleDateString(),
        r.driver.fullName,
        r.vehicle.registrationNumber,
        `$${Number(r.amount).toFixed(2)}`,
        r.status,
        r.notes || 'N/A',
      ]),
    ];

    const totalAmount = remittances.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      title: 'Remittance Summary Report',
      headers: rows[0] as string[],
      rows: rows.slice(1),
      metadata: {
        dateRange,
        totalAmount,
        recordCount: remittances.length,
      },
    };
  }

  /**
   * Get date range from filters
   */
  private getDateRange(filters?: Record<string, any>): { start: Date; end: Date } {
    if (filters?.startDate && filters?.endDate) {
      return {
        start: new Date(filters.startDate),
        end: new Date(filters.endDate),
      };
    }

    // Default to last 30 days
    return {
      start: subDays(new Date(), 30),
      end: new Date(),
    };
  }

  /**
   * Export to PDF file
   */
  private async exportToPDFFile(data: ReportData): Promise<string> {
    // In production, save to S3 and return URL
    // For now, return a placeholder path
    const filename = `${data.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    // TODO: Implement actual PDF generation and S3 upload
    return `/tmp/reports/${filename}`;
  }

  /**
   * Export to CSV file
   */
  private async exportToCSVFile(data: ReportData): Promise<string> {
    const filename = `${data.title.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    // TODO: Implement actual CSV generation and S3 upload
    return `/tmp/reports/${filename}`;
  }

  /**
   * Export to Excel file
   */
  private async exportToExcelFile(data: ReportData): Promise<string> {
    const filename = `${data.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    // TODO: Implement actual Excel generation and S3 upload
    return `/tmp/reports/${filename}`;
  }
}

export const reportGeneratorService = new ReportGeneratorService();

// Data export utilities for CSV, Excel, and PDF formats

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  includeHeaders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportableData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
  subtitle?: string;
}

// CSV Export
export function exportToCSV(data: ExportableData, filename: string = 'export.csv'): void {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Excel Export (using SheetJS)
export async function exportToExcel(data: ExportableData, filename: string = 'export.xlsx'): Promise<void> {
  try {
    // Dynamic import to avoid bundling issues
    const XLSX = await import('xlsx');
    
    const worksheet = XLSX.utils.aoa_to_sheet([
      data.headers,
      ...data.rows
    ]);

    // Set column widths
    const colWidths = data.headers.map((_, index) => {
      const maxLength = Math.max(
        data.headers[index].length,
        ...data.rows.map(row => String(row[index] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Failed to export to Excel. Please try CSV format instead.');
  }
}

// PDF Export (using jsPDF)
export async function exportToPDF(data: ExportableData, filename: string = 'export.pdf'): Promise<void> {
  try {
    // Dynamic import to avoid bundling issues
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Add title
    if (data.title) {
      doc.setFontSize(16);
      doc.text(data.title, 14, 22);
    }
    
    // Add subtitle
    if (data.subtitle) {
      doc.setFontSize(12);
      doc.text(data.subtitle, 14, 30);
    }

    // Add table
    const startY = data.title || data.subtitle ? 40 : 20;
    
    (doc as any).autoTable({
      head: [data.headers],
      body: data.rows,
      startY: startY,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // indigo-500
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // gray-50
      },
      margin: { top: startY, left: 14, right: 14 },
    });

    doc.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to export to PDF. Please try CSV format instead.');
  }
}

// Generic export function
export async function exportData(data: ExportableData, options: ExportOptions): Promise<void> {
  const filename = options.filename || `export.${options.format}`;
  
  switch (options.format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'excel':
      await exportToExcel(data, filename);
      break;
    case 'pdf':
      await exportToPDF(data, filename);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

// Data transformation utilities
export function transformVehiclesForExport(vehicles: any[]): ExportableData {
  return {
    title: 'Fleet Vehicles Export',
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    headers: [
      'Registration Number',
      'Make',
      'Model',
      'Year',
      'Type',
      'Status',
      'Current Mileage',
      'Initial Cost',
      'Assigned Driver',
      'Created Date'
    ],
    rows: vehicles.map(vehicle => [
      vehicle.registrationNumber,
      vehicle.make,
      vehicle.model,
      vehicle.year.toString(),
      vehicle.type.replace('_', ' '),
      vehicle.status.replace('_', ' '),
      vehicle.currentMileage.toString(),
      `$${Number(vehicle.initialCost).toFixed(2)}`,
      vehicle.drivers?.[0]?.driver?.fullName || 'Unassigned',
      new Date(vehicle.createdAt).toLocaleDateString()
    ])
  };
}

export function transformDriversForExport(drivers: any[]): ExportableData {
  return {
    title: 'Drivers Export',
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    headers: [
      'Full Name',
      'Phone',
      'Email',
      'License Number',
      'Payment Model',
      'Status',
      'Debt Balance',
      'Assigned Vehicle',
      'Created Date'
    ],
    rows: drivers.map(driver => {
      // Payment model is now on vehicle - get from primary assigned vehicle
      const primaryVehicle = driver.vehicles?.find((v: any) => v.isPrimary && !v.endDate)?.vehicle 
        || driver.vehicles?.[0]?.vehicle;
      const paymentModel = primaryVehicle?.paymentModel?.replace('_', ' ') || 'Unassigned';
      
      return [
        driver.fullName,
        driver.phone || 'N/A',
        driver.email || 'N/A',
        driver.licenseNumber,
        paymentModel,
        driver.status,
        `$${Number(driver.debtBalance).toFixed(2)}`,
        primaryVehicle?.registrationNumber || 'Unassigned',
        new Date(driver.createdAt).toLocaleDateString()
      ];
    })
  };
}

export function transformFinancialDataForExport(incomes: any[], expenses: any[], remittances: any[]): ExportableData {
  const allTransactions = [
    ...incomes.map(income => ({
      type: 'Income',
      amount: Number(income.amount),
      date: income.date,
      description: income.description,
      vehicle: income.vehicle?.registrationNumber || 'N/A',
      driver: income.driver?.fullName || 'N/A'
    })),
    ...expenses.map(expense => ({
      type: 'Expense',
      amount: Number(expense.amount),
      date: expense.date,
      description: expense.description,
      vehicle: expense.vehicle?.registrationNumber || 'N/A',
      driver: expense.driver?.fullName || 'N/A'
    })),
    ...remittances.map(remittance => ({
      type: 'Remittance',
      amount: Number(remittance.amount),
      date: remittance.date,
      description: `Remittance from ${remittance.driver?.fullName || 'Unknown'}`,
      vehicle: remittance.vehicle?.registrationNumber || 'N/A',
      driver: remittance.driver?.fullName || 'N/A'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    title: 'Financial Transactions Export',
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    headers: [
      'Type',
      'Amount',
      'Date',
      'Description',
      'Vehicle',
      'Driver'
    ],
    rows: allTransactions.map(transaction => [
      transaction.type,
      `$${transaction.amount.toFixed(2)}`,
      new Date(transaction.date).toLocaleDateString(),
      transaction.description,
      transaction.vehicle,
      transaction.driver
    ])
  };
}
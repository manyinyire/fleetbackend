// PDF generation utilities using jsPDF

import { InvoiceData } from './invoice';

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Blob> {
  try {
    // Dynamic import to avoid bundling issues
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = '#1e3a8a'; // indigo-600
    const secondaryColor = '#6b7280'; // gray-500
    const lightGray = '#f9fafb'; // gray-50
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.tenant.name, 20, 25);
    
    // Invoice title
    doc.setFontSize(18);
    doc.text('INVOICE', pageWidth - 60, 25);
    
    // Invoice number and date
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - 60, 35);
    doc.text(`Date: ${formatDate(invoiceData.date)}`, pageWidth - 60, 40);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Company details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.tenant.address, 20, 55);
    doc.text(`${invoiceData.tenant.city}, ${invoiceData.tenant.country}`, 20, 60);
    doc.text(`Phone: ${invoiceData.tenant.phone}`, 20, 65);
    doc.text(`Email: ${invoiceData.tenant.email}`, 20, 70);
    
    if (invoiceData.tenant.taxNumber) {
      doc.text(`Tax #: ${invoiceData.tenant.taxNumber}`, 20, 75);
    }
    
    // Customer details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 90);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customer.name, 20, 100);
    
    if (invoiceData.customer.address) {
      doc.text(invoiceData.customer.address, 20, 105);
    }
    if (invoiceData.customer.city) {
      doc.text(`${invoiceData.customer.city}, ${invoiceData.customer.country || ''}`, 20, 110);
    }
    if (invoiceData.customer.phone) {
      doc.text(`Phone: ${invoiceData.customer.phone}`, 20, 115);
    }
    if (invoiceData.customer.email) {
      doc.text(`Email: ${invoiceData.customer.email}`, 20, 120);
    }
    
    // Due date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Due Date: ${formatDate(invoiceData.dueDate)}`, pageWidth - 60, 100);
    
    // Items table
    const tableTop = 130;
    const tableLeft = 20;
    const tableWidth = pageWidth - 40;
    const rowHeight = 15;
    
    // Table header
    doc.setFillColor(lightGray);
    doc.rect(tableLeft, tableTop, tableWidth, rowHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', tableLeft + 5, tableTop + 10);
    doc.text('Qty', tableLeft + 120, tableTop + 10);
    doc.text('Unit Price', tableLeft + 140, tableTop + 10);
    doc.text('Total', tableLeft + 170, tableTop + 10);
    
    // Table rows
    let currentY = tableTop + rowHeight;
    doc.setFont('helvetica', 'normal');
    
    invoiceData.items.forEach((item, index) => {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(lightGray);
      }
      doc.rect(tableLeft, currentY, tableWidth, rowHeight, 'F');
      
      // Item details
      doc.text(item.description, tableLeft + 5, currentY + 10);
      doc.text(item.quantity.toString(), tableLeft + 120, currentY + 10);
      doc.text(formatCurrency(item.unitPrice, invoiceData.currency), tableLeft + 140, currentY + 10);
      doc.text(formatCurrency(item.total, invoiceData.currency), tableLeft + 170, currentY + 10);
      
      currentY += rowHeight;
    });
    
    // Totals section
    const totalsY = Math.max(currentY + 10, pageHeight - 80);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', tableLeft + 140, totalsY);
    doc.text(formatCurrency(invoiceData.subtotal, invoiceData.currency), tableLeft + 170, totalsY);
    
    doc.text(`Tax (${(invoiceData.taxRate * 100).toFixed(1)}%):`, tableLeft + 140, totalsY + 10);
    doc.text(formatCurrency(invoiceData.taxAmount, invoiceData.currency), tableLeft + 170, totalsY + 10);
    
    // Total line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', tableLeft + 140, totalsY + 25);
    doc.text(formatCurrency(invoiceData.total, invoiceData.currency), tableLeft + 170, totalsY + 25);
    
    // Notes
    if (invoiceData.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Notes:', tableLeft, totalsY + 45);
      doc.text(invoiceData.notes, tableLeft, totalsY + 55);
    }
    
    // Footer
    if (invoiceData.footer) {
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor);
      doc.text(invoiceData.footer, tableLeft, pageHeight - 20);
    }
    
    // Bank details
    if (invoiceData.tenant.bankDetails) {
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor);
      const bankY = pageHeight - 40;
      doc.text('Bank Details:', tableLeft, bankY);
      doc.text(invoiceData.tenant.bankDetails, tableLeft, bankY + 8);
    }
    
    return doc.output('blob');
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

// Helper function to format date
function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
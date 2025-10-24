// Invoice generation utilities with PDF templates

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  tenant: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    taxNumber?: string;
    bankDetails?: string;
  };
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  footer?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vehicleId?: string;
  driverId?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  isDefault: boolean;
}

// Generate invoice number
export function generateInvoiceNumber(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const sequenceStr = String(sequence).padStart(3, '0');
  return `${prefix}-${year}${month}-${sequenceStr}`;
}

// Calculate invoice totals
export function calculateInvoiceTotals(items: InvoiceItem[], taxRate: number = 0.15): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  return { subtotal, taxAmount, total };
}

// Validate invoice data
export function validateInvoiceData(data: InvoiceData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.tenant.name) errors.push('Tenant name is required');
  if (!data.customer.name) errors.push('Customer name is required');
  if (!data.items.length) errors.push('At least one item is required');
  if (data.items.some(item => item.quantity <= 0)) errors.push('All items must have quantity > 0');
  if (data.items.some(item => item.unitPrice < 0)) errors.push('All items must have unit price >= 0');
  if (!data.date) errors.push('Invoice date is required');
  if (!data.dueDate) errors.push('Due date is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

// Format date
export function formatDate(date: string | Date, format: string = 'MMM DD, YYYY'): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  };
  return d.toLocaleDateString('en-US', options);
}

// Default invoice templates
export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Invoice',
    description: 'Clean, professional invoice template',
    template: 'standard',
    isDefault: true,
  },
  {
    id: 'minimal',
    name: 'Minimal Invoice',
    description: 'Simple, minimal design',
    template: 'minimal',
    isDefault: false,
  },
  {
    id: 'detailed',
    name: 'Detailed Invoice',
    description: 'Comprehensive invoice with item details',
    template: 'detailed',
    isDefault: false,
  },
];

// Invoice statuses
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// Get invoice status color
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.DRAFT:
      return 'bg-gray-100 text-gray-800';
    case InvoiceStatus.SENT:
      return 'bg-blue-100 text-blue-800';
    case InvoiceStatus.PAID:
      return 'bg-green-100 text-green-800';
    case InvoiceStatus.OVERDUE:
      return 'bg-red-100 text-red-800';
    case InvoiceStatus.CANCELLED:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
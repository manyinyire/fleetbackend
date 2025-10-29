import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { prisma } from './prisma';

interface InvoiceData {
  tenantId: string;
  type: 'SUBSCRIPTION' | 'UPGRADE' | 'RENEWAL' | 'OVERAGE' | 'CUSTOM';
  plan: 'FREE' | 'BASIC' | 'PREMIUM';
  amount: number;
  description?: string;
  billingPeriod?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

class InvoiceGenerator {
  private generateInvoiceNumber(tenantId: string, type: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const typePrefix = type.charAt(0).toUpperCase();
    return `INV-${typePrefix}-${timestamp}`;
  }

  private getPlanPricing(plan: string): { monthly: number; features: string[] } {
    const pricing = {
      FREE: { monthly: 0, features: ['Up to 5 vehicles', 'Basic reporting', 'Email support'] },
      BASIC: { monthly: 29.99, features: ['Up to 25 vehicles', 'Advanced reporting', 'Priority support', 'API access'] },
      PREMIUM: { monthly: 99.99, features: ['Unlimited vehicles', 'Custom reporting', '24/7 support', 'Full API access', 'Custom integrations'] }
    };
    return pricing[plan as keyof typeof pricing] || pricing.FREE;
  }

  private generateInvoiceItems(data: InvoiceData): InvoiceItem[] {
    const items: InvoiceItem[] = [];
    const pricing = this.getPlanPricing(data.plan);

    if (data.type === 'SUBSCRIPTION' || data.type === 'RENEWAL') {
      items.push({
        description: `${data.plan} Plan Subscription${data.billingPeriod ? ` - ${data.billingPeriod}` : ''}`,
        quantity: 1,
        unitPrice: pricing.monthly,
        total: pricing.monthly
      });
    } else if (data.type === 'UPGRADE') {
      // Calculate upgrade cost based on plan difference
      const currentPlan = data.plan === 'PREMIUM' ? 'BASIC' : 'FREE';
      const currentPricing = this.getPlanPricing(currentPlan);
      const upgradeAmount = pricing.monthly - currentPricing.monthly;
      
      items.push({
        description: `Upgrade to ${data.plan} Plan`,
        quantity: 1,
        unitPrice: upgradeAmount,
        total: upgradeAmount
      });
    } else if (data.type === 'OVERAGE') {
      items.push({
        description: data.description || 'Overage charges',
        quantity: 1,
        unitPrice: data.amount,
        total: data.amount
      });
    } else {
      items.push({
        description: data.description || 'Custom charge',
        quantity: 1,
        unitPrice: data.amount,
        total: data.amount
      });
    }

    return items;
  }

  async generateInvoice(data: InvoiceData): Promise<{ invoice: any; pdf: Buffer }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      include: { settings: true }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const invoiceNumber = this.generateInvoiceNumber(data.tenantId, data.type);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

    const items = this.generateInvoiceItems(data);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.15; // 15% tax (adjust as needed)
    const total = subtotal + tax;

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: data.tenantId,
        invoiceNumber,
        type: data.type,
        amount: total,
        dueDate,
        plan: data.plan,
        billingPeriod: data.billingPeriod,
        description: data.description,
      }
    });

    // Generate PDF
    const pdf = await this.generatePDF(invoice, tenant, items, subtotal, tax, total);

    // Update invoice with PDF URL (you would upload to S3 in production)
    const pdfUrl = `invoices/${invoiceNumber}.pdf`;
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl }
    });

    return { invoice, pdf };
  }

  private async generatePDF(
    invoice: any,
    tenant: any,
    items: InvoiceItem[],
    subtotal: number,
    tax: number,
    total: number
  ): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin - 50, 30);

    // Company info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Fleet Manager', margin, 30);
    doc.text('123 Business Street', margin, 35);
    doc.text('Harare, Zimbabwe', margin, 40);
    doc.text('Email: billing@fleetmanager.com', margin, 45);
    doc.text('Phone: +263 4 123 4567', margin, 50);

    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin - 50, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 40);
    doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, pageWidth - margin - 50, 45);
    doc.text(`Status: ${invoice.status}`, pageWidth - margin - 50, 50);

    // Bill to
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(tenant.name, margin, 75);
    doc.text(tenant.email, margin, 80);
    if (tenant.phone) {
      doc.text(tenant.phone, margin, 85);
    }

    // Items table
    const tableData = items.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.total.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: 95,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text('Subtotal:', pageWidth - margin - 50, finalY);
    doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin - 10, finalY);
    
    doc.text('Tax (15%):', pageWidth - margin - 50, finalY + 5);
    doc.text(`$${tax.toFixed(2)}`, pageWidth - margin - 10, finalY + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', pageWidth - margin - 50, finalY + 10);
    doc.text(`$${total.toFixed(2)}`, pageWidth - margin - 10, finalY + 10);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Thank you for your business!', margin, finalY + 30);
    doc.text('Payment terms: Net 30 days', margin, finalY + 35);
    doc.text('Questions? Contact us at support@fleetmanager.com', margin, finalY + 40);

    return Buffer.from(doc.output('arraybuffer'));
  }

  async createFreePlanInvoice(tenantId: string): Promise<{ invoice: any; pdf: Buffer }> {
    return this.generateInvoice({
      tenantId,
      type: 'SUBSCRIPTION',
      plan: 'FREE',
      amount: 0,
      description: 'Free plan subscription',
      billingPeriod: 'Monthly'
    });
  }

  async createUpgradeInvoice(tenantId: string, newPlan: 'BASIC' | 'PREMIUM'): Promise<{ invoice: any; pdf: Buffer }> {
    return this.generateInvoice({
      tenantId,
      type: 'UPGRADE',
      plan: newPlan,
      amount: 0, // Will be calculated based on plan pricing
      description: `Upgrade to ${newPlan} plan`
    });
  }

  async createRenewalInvoice(tenantId: string, plan: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<{ invoice: any; pdf: Buffer }> {
    const pricing = this.getPlanPricing(plan);
    return this.generateInvoice({
      tenantId,
      type: 'RENEWAL',
      plan,
      amount: pricing.monthly,
      description: `${plan} plan renewal`,
      billingPeriod: 'Monthly'
    });
  }
}

export const invoiceGenerator = new InvoiceGenerator();
export default invoiceGenerator;
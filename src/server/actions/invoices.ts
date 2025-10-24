'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { generateInvoicePDF, InvoiceData } from '@/lib/pdf-generator';
import { generateInvoiceNumber, calculateInvoiceTotals, validateInvoiceData } from '@/lib/invoice';
import { revalidatePath } from 'next/cache';

export async function createInvoice(data: InvoiceData) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  try {
    // Validate invoice data
    const validation = validateInvoiceData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Get tenant settings for invoice prefix
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });

    const invoicePrefix = settings?.invoicePrefix || 'INV';
    
    // Get next invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    const sequence = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0') + 1 : 1;
    const invoiceNumber = generateInvoiceNumber(invoicePrefix, sequence);

    // Calculate totals
    const totals = calculateInvoiceTotals(data.items, data.taxRate);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        customerPhone: data.customer.phone,
        customerAddress: data.customer.address,
        customerCity: data.customer.city,
        customerCountry: data.customer.country,
        invoiceDate: new Date(data.date),
        dueDate: new Date(data.dueDate),
        subtotal: totals.subtotal,
        taxRate: data.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        currency: data.currency,
        status: 'DRAFT',
        notes: data.notes,
        items: data.items,
        createdBy: user.id
      }
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'CREATE',
        entityType: 'Invoice',
        entityId: invoice.id,
        details: {
          invoiceNumber,
          customerName: data.customer.name,
          total: totals.total
        }
      }
    });

    revalidatePath('/invoices');
    return { success: true, invoice };
  } catch (error) {
    console.error('Invoice creation error:', error);
    throw error;
  }
}

export async function generateInvoicePDFAction(invoiceId: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  try {
    // Get invoice with tenant details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get tenant settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });

    if (!settings) {
      throw new Error('Tenant settings not found');
    }

    // Prepare invoice data for PDF generation
    const invoiceData: InvoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      tenant: {
        name: settings.companyName,
        email: settings.email,
        phone: settings.phone,
        address: settings.address || '',
        city: settings.city || '',
        country: settings.country,
        taxNumber: settings.taxNumber,
        bankDetails: settings.bankDetails
      },
      customer: {
        name: invoice.customerName,
        email: invoice.customerEmail,
        phone: invoice.customerPhone,
        address: invoice.customerAddress,
        city: invoice.customerCity,
        country: invoice.customerCountry
      },
      items: invoice.items as any[],
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      currency: invoice.currency,
      notes: invoice.notes,
      footer: settings.invoiceFooter
    };

    // Generate PDF
    const pdfBlob = await generateInvoicePDF(invoiceData);

    // Log the PDF generation
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'GENERATE_PDF',
        entityType: 'Invoice',
        entityId: invoice.id,
        details: {
          invoiceNumber: invoice.invoiceNumber
        }
      }
    });

    return { success: true, pdfBlob };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status }
    });

    // Log the status update
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Invoice',
        entityId: invoice.id,
        details: {
          invoiceNumber: invoice.invoiceNumber,
          newStatus: status
        }
      }
    });

    revalidatePath('/invoices');
    return { success: true, invoice };
  } catch (error) {
    console.error('Invoice status update error:', error);
    throw error;
  }
}

export async function getInvoices() {
  const { tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, invoices };
  } catch (error) {
    console.error('Get invoices error:', error);
    throw error;
  }
}
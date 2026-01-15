import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth } from '@/lib/api-middleware';
import invoiceGenerator from '@/lib/invoice-generator';

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  // Extract id from URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.indexOf('invoices') + 1];

  try {
    // Fetch invoice with tenant details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        tenantId: tenantId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Generate PDF using the singleton instance
    
    // Determine invoice items based on type
    let items: any[] = [];
    let subtotal = Number(invoice.amount);
    let tax = 0;
    let total = Number(invoice.amount);

    if (invoice.type === 'SUBSCRIPTION' || invoice.type === 'RENEWAL') {
      items = [{
        description: `${invoice.type === 'RENEWAL' ? 'Subscription Renewal' : 'Subscription'} - ${invoice.plan} Plan`,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
      }];
    } else if (invoice.type === 'UPGRADE') {
      items = [{
        description: `Plan Upgrade to ${invoice.plan}`,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
      }];
    } else {
      items = [{
        description: invoice.type || 'Invoice',
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
      }];
    }

    // Generate the PDF
    const pdf = await (invoiceGenerator as any).generatePDF(
      invoice,
      invoice.tenant,
      items,
      subtotal,
      tax,
      total
    );

    // Return PDF as response
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate PDF',
        code: 'PDF_GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
});

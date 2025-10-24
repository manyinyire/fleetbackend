import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { InvoicesTable } from '@/components/invoices/invoices-table';
import { CreateInvoiceButton } from '@/components/invoices/create-invoice-button';

export default async function InvoicesPage() {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch invoices
  const invoices = await prisma.invoice.findMany({
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-2 text-gray-600">
            Manage your invoices and billing.
          </p>
        </div>
        <CreateInvoiceButton />
      </div>

      <InvoicesTable invoices={invoices} />
    </div>
  );
}
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { ComprehensiveFinancialReports } from '@/components/finances/comprehensive-financial-reports';
import { getFinancialPeriods } from '@/lib/financial-reports';

export default async function ComprehensiveFinancialReportsPage() {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch comprehensive financial data
  const [incomes, expenses, vehicles, invoices] = await Promise.all([
    prisma.income.findMany({
      orderBy: { date: 'desc' }
    }),
    prisma.expense.findMany({
      orderBy: { date: 'desc' }
    }),
    prisma.vehicle.findMany({
      include: {
        drivers: {
          include: {
            driver: true
          }
        }
      }
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Get available periods
  const periods = getFinancialPeriods();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comprehensive Financial Reports</h1>
        <p className="mt-2 text-gray-600">
          Detailed financial analysis including P&L, Cash Flow, and Balance Sheet.
        </p>
      </div>

      <ComprehensiveFinancialReports 
        incomes={incomes}
        expenses={expenses}
        vehicles={vehicles}
        invoices={invoices}
        periods={periods}
      />
    </div>
  );
}
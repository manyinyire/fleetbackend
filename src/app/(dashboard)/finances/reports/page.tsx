import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { FinancialReportsDashboard } from '@/components/finances/financial-reports-dashboard';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export default async function FinancialReportsPage() {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch financial data for the last 12 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const [incomes, expenses, remittances] = await Promise.all([
    prisma.income.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        vehicle: true,
        driver: true
      },
      orderBy: { date: 'desc' }
    }),
    prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        vehicle: true,
        driver: true
      },
      orderBy: { date: 'desc' }
    }),
    prisma.remittance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        vehicle: true,
        driver: true
      },
      orderBy: { date: 'desc' }
    })
  ]);

  // Calculate summary statistics
  const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalRemittances = remittances.reduce((sum, remittance) => sum + Number(remittance.amount), 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive financial analytics and reporting for your fleet.
          </p>
        </div>
        <DateRangePicker />
      </div>

      <FinancialReportsDashboard 
        incomes={incomes}
        expenses={expenses}
        remittances={remittances}
        summary={{
          totalIncome,
          totalExpenses,
          totalRemittances,
          netProfit
        }}
      />
    </div>
  );
}
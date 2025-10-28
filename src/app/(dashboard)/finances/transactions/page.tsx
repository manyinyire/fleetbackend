import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import FinancesTransactionsPage from '@/components/finances/finances-transactions-page';

export default async function TransactionsPage() {
  const { user, tenantId } = await requireTenantForDashboard();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch initial data using the same logic as vehicle page
  const [expensesRaw, incomesRaw, vehiclesRaw, remittancesRaw, maintenanceRaw] = await Promise.all([
    prisma.expense.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    }),
    prisma.income.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    }),
    prisma.vehicle.findMany({
      select: {
        id: true,
        registrationNumber: true,
        make: true,
        model: true,
      },
    }),
    prisma.remittance.findMany({
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    }),
    prisma.maintenanceRecord.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    }),
  ]);

  // Convert Decimal objects to numbers for client component
  const expenses = serializePrismaResults(expensesRaw);
  const incomes = serializePrismaResults(incomesRaw);
  const vehicles = serializePrismaResults(vehiclesRaw);
  const remittances = serializePrismaResults(remittancesRaw);
  const maintenance = serializePrismaResults(maintenanceRaw);

  return (
    <FinancesTransactionsPage
      initialExpenses={expenses}
      initialIncomes={incomes}
      vehicles={vehicles as any}
      initialRemittances={remittances}
      initialMaintenance={maintenance}
    />
  );
}
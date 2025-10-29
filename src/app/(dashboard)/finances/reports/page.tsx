import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import { FinancialReportsClient } from '@/components/finances/financial-reports-client';

export default async function FinancialReportsPage() {
  const { user, tenantId } = await requireTenantForDashboard();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch financial data for the last 12 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const [incomes, expenses, remittances, maintenance] = await Promise.all([
    prisma.income.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        tenantId: tenantId
      },
      include: {
        vehicle: true
      },
      orderBy: { date: 'desc' }
    }),
    prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        tenantId: tenantId
      },
      include: {
        vehicle: true
      },
      orderBy: { date: 'desc' }
    }),
    prisma.remittance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        tenantId: tenantId
      },
      include: {
        vehicle: true,
        driver: true
      },
      orderBy: { date: 'desc' }
    }),
    prisma.maintenanceRecord.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        tenantId: tenantId
      },
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' }
    })
  ]);

  // Serialize data for client component
  const serializedIncomes = serializePrismaResults(incomes);
  const serializedExpenses = serializePrismaResults(expenses);
  const serializedRemittances = serializePrismaResults(remittances);
  const serializedMaintenance = serializePrismaResults(maintenance);

  // Calculate summary statistics using remittances as income and including maintenance in expenses
  const totalIncome = (serializedRemittances as any[]).reduce((sum: any, r: any) => sum + Number(r.amount), 0);
  const totalExpenses = (serializedExpenses as any[]).reduce((sum: any, e: any) => sum + Number(e.amount), 0) +
    (serializedMaintenance as any[]).reduce((sum: any, m: any) => sum + Number(m.cost), 0);
  const totalRemittances = totalIncome;
  const netProfit = totalIncome - totalExpenses;

  return (
    <FinancialReportsClient 
      initialIncomes={serializedRemittances.map((r: any) => ({ id: r.id, amount: r.amount, date: r.date, vehicle: r.vehicle ?? null }))}
      initialExpenses={[
        ...serializedExpenses.map((e: any) => ({ id: e.id, amount: e.amount, date: e.date, vehicle: e.vehicle ?? null })),
        ...serializedMaintenance.map((m: any) => ({ id: m.id, amount: m.cost, date: m.date, vehicle: m.vehicle ?? null }))
      ]}
      initialRemittances={serializedRemittances}
      initialMaintenance={serializedMaintenance}
      initialSummary={{
        totalIncome,
        totalExpenses,
        totalRemittances,
        netProfit
      }}
    />
  );
}
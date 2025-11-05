import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaResults, serializePrismaData } from '@/lib/serialize-prisma';
import { FinancialReportsClient } from '@/components/finances/financial-reports-client';
import { calculateVehicleProfitability } from '@/lib/vehicle-profitability';

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

  const [incomes, expenses, remittances, maintenance, vehicles] = await Promise.all([
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
    }),
    // Fetch all vehicles with their remittances and maintenance records
    prisma.vehicle.findMany({
      where: {
        tenantId: tenantId
      },
      include: {
        remittances: {
          select: {
            amount: true,
            date: true,
            status: true
          }
        },
        maintenanceRecords: {
          select: {
            cost: true,
            date: true
          }
        },
        expenses: {
          select: {
            amount: true,
            date: true
          }
        },
        drivers: {
          where: {
            endDate: null // Only active assignments
          },
          include: {
            driver: {
              select: {
                id: true,
                fullName: true,
                debtBalance: true
              }
            }
          }
        }
      },
      orderBy: { registrationNumber: 'asc' }
    })
  ]);

  // Serialize data for client component
  const serializedIncomes = serializePrismaResults(incomes);
  const serializedExpenses = serializePrismaResults(expenses);
  const serializedRemittances = serializePrismaResults(remittances);
  const serializedMaintenance = serializePrismaResults(maintenance);
  const serializedVehicles = serializePrismaResults(vehicles);

  // Calculate profitability for each vehicle
  const vehicleProfitability = (serializedVehicles as any[]).map((vehicle) => {
    // Get approved remittances for this vehicle
    const vehicleRemittances = vehicle.remittances
      .filter((r: any) => r.status === 'APPROVED')
      .map((r: any) => ({
        amount: Number(r.amount),
        date: new Date(r.date)
      }));

    // Combine maintenance and expenses for this vehicle
    const vehicleExpenses = [
      ...vehicle.maintenanceRecords.map((m: any) => ({
        amount: Number(m.cost),
        date: new Date(m.date)
      })),
      ...vehicle.expenses.map((e: any) => ({
        amount: Number(e.amount),
        date: new Date(e.date)
      }))
    ];

    // Calculate driver salary (simplified - using debt balance as proxy)
    const activeDriver = vehicle.drivers.find((d: any) => !d.endDate)?.driver;
    const driverSalary = activeDriver && vehicle.paymentModel !== 'DRIVER_REMITS'
      ? Number(activeDriver.debtBalance)
      : 0;

    // Calculate profitability
    const profitability = calculateVehicleProfitability({
      initialCost: Number(vehicle.initialCost),
      createdAt: new Date(vehicle.createdAt),
      remittances: vehicleRemittances,
      expenses: vehicleExpenses,
      driverSalary
    });

    return {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      ...profitability
    };
  });

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
      vehicleProfitability={vehicleProfitability}
      initialSummary={{
        totalIncome,
        totalExpenses,
        totalRemittances,
        netProfit
      }}
    />
  );
}
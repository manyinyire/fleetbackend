import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaData } from '@/lib/serialize-prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { 
  calculateVehicleProfitability, 
  getOverallStatusDisplay, 
  getFinancialStatusDisplay 
} from '@/lib/vehicle-profitability';
import { VehicleProfitabilityDisplay } from '@/components/vehicles/vehicle-profitability-display';

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, tenantId } = await requireTenantForDashboard();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch vehicle with all related data
  const vehicleRaw = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      drivers: {
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              debtBalance: true,
            },
          },
        },
      },
      maintenanceRecords: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      remittances: {
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      expenses: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      incomes: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  });

  if (!vehicleRaw) {
    notFound();
  }

  // Serialize all Decimal fields to numbers
  const vehicle = serializePrismaData(vehicleRaw);

  // Calculate profitability metrics
  // Get ALL remittances, expenses, incomes, and maintenance records for the vehicle (not just the last 10)
  const [allRemittances, allExpenses, allIncomes, allMaintenanceRecords] = await Promise.all([
    prisma.remittance.findMany({
      where: { 
        vehicleId: vehicle.id,
        tenantId: tenantId
      },
      orderBy: { date: 'desc' },
    }),
    prisma.expense.findMany({
      where: { 
        vehicleId: vehicle.id,
        tenantId: tenantId
      },
      orderBy: { date: 'desc' },
    }),
    prisma.income.findMany({
      where: { 
        vehicleId: vehicle.id,
        tenantId: tenantId
      },
      orderBy: { date: 'desc' },
    }),
    prisma.maintenanceRecord.findMany({
      where: { 
        vehicleId: vehicle.id,
        tenantId: tenantId
      },
      orderBy: { date: 'desc' },
    }),
  ]);

  // Calculate driver salary (for now, we'll use debtBalance as a proxy)
  // TODO: Enhance this to calculate based on payment model and assignment period
  // Payment model is now on vehicle - drivers inherit it when assigned
  const activeDriver = vehicle.drivers.find((d: any) => !d.endDate)?.driver;
  const driverSalary = activeDriver && vehicle.paymentModel !== 'DRIVER_REMITS' 
    ? Number(activeDriver.debtBalance) 
    : 0;

  const profitability = calculateVehicleProfitability({
    initialCost: Number(vehicle.initialCost),
    createdAt: vehicle.createdAt,
    remittances: allRemittances.map((r: any) => ({
      amount: Number(r.amount),
      date: r.date,
    })),
    expenses: [
      ...allExpenses.map((e: any) => ({
        amount: Number(e.amount),
        date: e.date,
      })),
      ...allMaintenanceRecords.map((m: any) => ({
        amount: Number(m.cost),
        date: m.date,
      })),
    ],
    driverSalary,
  });

  const overallDisplay = getOverallStatusDisplay(profitability.overallStatus);
  const financialDisplay = getFinancialStatusDisplay(profitability.financialStatus);

  const totalRemittances = allRemittances.reduce(
    (sum: any, r: any) => sum + Number(r.amount),
    0
  );
  const totalExpenses = allExpenses.reduce((sum: any, e: any) => sum + Number(e.amount), 0) + 
                       allMaintenanceRecords.reduce((sum: any, m: any) => sum + Number(m.cost), 0);
  const netProfit = totalRemittances - totalExpenses;

  const stats = {
    totalRemittances,
    totalExpenses,
    netProfit,
    maintenanceCount: vehicle.maintenanceRecords.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-light-6 text-green';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-light-4 text-yellow-dark';
      case 'DECOMMISSIONED':
        return 'bg-red-light-5 text-red';
      default:
        return 'bg-gray-2 text-dark';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CAR':
        return '🚗';
      case 'OMNIBUS':
        return '🚌';
      case 'BIKE':
        return '🏍️';
      default:
        return '🚗';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vehicles"
            className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-stroke hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getTypeIcon(vehicle.type)}</span>
            <div>
              <h1 className="text-heading-5 font-bold text-dark dark:text-white">
                {vehicle.registrationNumber}
              </h1>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/vehicles/${vehicle.id}/edit`}
          className="inline-flex items-center gap-2 rounded-[7px] bg-primary px-4.5 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
        >
          <PencilIcon className="h-5 w-5" />
          Edit Vehicle
        </Link>
      </div>

      {/* Vehicle Info Card */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Vehicle Information
          </h3>
        </div>
        <div className="p-7">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Registration Number
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {vehicle.registrationNumber}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Make</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {vehicle.make}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Model</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {vehicle.model}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Year</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {vehicle.year}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Type</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {vehicle.type}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-body-sm font-medium ${getStatusColor(
                  vehicle.status
                )}`}
              >
                {vehicle.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Current Mileage
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {vehicle.currentMileage.toLocaleString()} km
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Initial Cost
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                ${Number(vehicle.initialCost).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-light-5">
              <svg
                className="h-6 w-6 text-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Total Remittances
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                ${stats.totalRemittances.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-light-5">
              <svg
                className="h-6 w-6 text-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Total Expenses
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                ${stats.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-light-6">
              <svg
                className="h-6 w-6 text-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Net Profit
              </p>
              <p className={`text-heading-6 font-bold ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${stats.netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-light-4">
              <svg
                className="h-6 w-6 text-yellow-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Maintenance Records
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.maintenanceCount}
              </p>
            </div>
          </div>
        </div>
             </div>

       {/* Vehicle Profitability */}
       <VehicleProfitabilityDisplay profitability={profitability} />

       {/* Assigned Drivers */}
       <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="px-4 py-6 md:px-6 xl:px-9">
          <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
            Assigned Drivers
          </h4>
        </div>
        <div className="p-7 pt-0">
          {vehicle.drivers.length === 0 ? (
            <p className="text-center text-dark-5 py-8">No drivers assigned</p>
          ) : (
            <div className="space-y-3">
              {vehicle.drivers.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-[7px] border border-stroke p-4 dark:border-dark-3"
                >
                  <div>
                    <p className="font-medium text-dark dark:text-white">
                      {assignment.driver.fullName}
                    </p>
                    <p className="text-body-sm text-dark-5 dark:text-dark-6">
                      {assignment.driver.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm text-dark-5 dark:text-dark-6">
                      Since {new Date(assignment.startDate).toLocaleDateString()}
                    </p>
                    {assignment.isPrimary && (
                      <span className="mt-1 inline-flex rounded-full bg-blue-light-5 px-3 py-1 text-body-xs font-medium text-blue">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

             {/* Recent Maintenance */}
       {vehicle.maintenanceRecords.length > 0 && (
         <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
           <div className="px-4 py-6 md:px-6 xl:px-9 flex items-center justify-between">
             <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
               Recent Maintenance
             </h4>
                           <Link
                href={`/maintenance/new?vehicleId=${vehicle.id}`}
                className="inline-flex items-center gap-2 rounded-[7px] bg-primary px-4.5 py-[7px] text-sm font-medium text-gray-2 hover:bg-opacity-90"
              >
                <WrenchScrewdriverIcon className="h-4 w-4" />
                Add Maintenance
              </Link>
           </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-t border-stroke dark:border-dark-3">
                  <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                    Date
                  </th>
                  <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                    Type
                  </th>
                  <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                    Description
                  </th>
                  <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicle.maintenanceRecords.map((record: any) => (
                  <tr
                    key={record.id}
                    className="border-t border-stroke dark:border-dark-3"
                  >
                    <td className="px-4 py-5">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-5">
                      {record.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-5 max-w-xs truncate">
                      {record.description}
                    </td>
                    <td className="px-4 py-5">
                      ${Number(record.cost).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

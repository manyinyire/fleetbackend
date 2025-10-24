import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export default async function MaintenancePage() {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch maintenance records with related data
  const maintenanceRecords = await prisma.maintenanceRecord.findMany({
    include: {
      vehicle: true,
    },
    orderBy: { date: 'desc' },
  });

  const stats = {
    total: maintenanceRecords.length,
    totalCost: maintenanceRecords.reduce((sum, r) => sum + Number(r.cost), 0),
    thisMonth: maintenanceRecords.filter(
      r =>
        new Date(r.date).getMonth() === new Date().getMonth() &&
        new Date(r.date).getFullYear() === new Date().getFullYear()
    ).length,
    avgCost:
      maintenanceRecords.length > 0
        ? maintenanceRecords.reduce((sum, r) => sum + Number(r.cost), 0) /
          maintenanceRecords.length
        : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-5 font-bold text-dark dark:text-white">
            Maintenance
          </h1>
          <p className="text-body-sm text-dark-5 dark:text-dark-6">
            Track vehicle maintenance and service records
          </p>
        </div>
        <Link
          href="/maintenance/new"
          className="inline-flex items-center gap-2 rounded-[7px] bg-primary px-4.5 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Add Record
        </Link>
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Total Records
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.total}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">This Month</p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.thisMonth}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">Total Cost</p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                ${stats.totalCost.toLocaleString()}
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">Avg Cost</p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                ${stats.avgCost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="px-4 py-6 md:px-6 xl:px-9">
          <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
            Maintenance Records
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-t border-stroke dark:border-dark-3">
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Date
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Vehicle
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Type
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Description
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Provider
                </th>
                <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-dark-5">
                    No maintenance records found. Add your first record to get started.
                  </td>
                </tr>
              ) : (
                maintenanceRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-stroke dark:border-dark-3"
                  >
                    <td className="px-4 py-5">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-5">
                      {record.vehicle.registrationNumber}
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-body-sm">
                        {record.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-5 max-w-xs truncate">
                      {record.description}
                    </td>
                    <td className="px-4 py-5">{record.provider}</td>
                    <td className="px-4 py-5">
                      ${Number(record.cost).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

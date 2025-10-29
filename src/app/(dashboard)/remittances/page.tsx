import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { RemittancesTable } from '@/components/finances/remittances-table';

export default async function RemittancesPage() {
  const { user, tenantId } = await requireTenantForDashboard();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch remittances with related data
  const remittances = await prisma.remittance.findMany({
    include: {
      driver: true,
      vehicle: true,
    },
    orderBy: { date: 'desc' },
    where: {
      tenantId: tenantId
    }
  });

  const stats = {
    total: remittances.length,
    pending: remittances.filter((r: any) => r.status === 'PENDING').length,
    approved: remittances.filter((r: any) => r.status === 'APPROVED').length,
    rejected: remittances.filter((r: any) => r.status === 'REJECTED').length,
    totalAmount: remittances
      .filter((r: any) => r.status === 'APPROVED')
      .reduce((sum: any, r: any) => sum + Number(r.amount), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Remittances</h1>
          <p className="mt-2 text-gray-600">
            Manage driver remittances and track payment status.
          </p>
        </div>
        <Link
          href="/remittances/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Remittance
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">Approved</p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.approved}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">Pending</p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.pending}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">Rejected</p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>

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
              <p className="text-body-xs text-dark-5 dark:text-dark-6">Total Amount</p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                ${stats.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Remittances Table */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="px-4 py-6 md:px-6 xl:px-9">
          <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
            Recent Remittances
          </h4>
        </div>

        <RemittancesTable remittances={remittances} />
      </div>
    </div>
  );
}

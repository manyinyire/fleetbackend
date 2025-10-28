import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { DriversTable } from '@/components/drivers/drivers-table';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export default async function DriversPage() {
  const { user, tenantId } = await requireTenantForDashboard();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch drivers with related data
  const drivers = await prisma.driver.findMany({
    include: {
      vehicles: {
        include: {
          vehicle: true
        }
      },
      remittances: {
        orderBy: { date: 'desc' },
        take: 3
      },
      _count: {
        select: {
          remittances: true,
          contracts: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    where: {
      tenantId: tenantId
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-2 text-gray-600">
            Manage your drivers, contracts, and payment tracking.
          </p>
        </div>
        <Link
          href="/drivers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Driver
        </Link>
      </div>

      <DriversTable drivers={drivers} />
    </div>
  );
}
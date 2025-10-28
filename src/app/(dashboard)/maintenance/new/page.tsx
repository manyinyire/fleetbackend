import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { MaintenanceForm } from '@/components/maintenance/maintenance-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function NewMaintenancePage({
  searchParams,
}: {
  searchParams: { vehicleId?: string };
}) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch all vehicles
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      registrationNumber: true,
      make: true,
      model: true,
      currentMileage: true,
    },
    orderBy: { registrationNumber: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/maintenance"
          className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-stroke hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-heading-5 font-bold text-dark dark:text-white">
            Add Maintenance Record
          </h1>
          <p className="text-body-sm text-dark-5 dark:text-dark-6">
            Record a new maintenance service
          </p>
        </div>
      </div>

      <div className="rounded-[10px] bg-white p-7 shadow-1 dark:bg-gray-dark">
        <MaintenanceForm vehicles={vehicles} vehicleId={searchParams.vehicleId} />
      </div>
    </div>
  );
}

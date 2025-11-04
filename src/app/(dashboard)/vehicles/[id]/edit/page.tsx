import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaData } from '@/lib/serialize-prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { VehicleEditForm } from '@/components/vehicles/vehicle-edit-form';

export default async function EditVehiclePage({
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

  // Fetch vehicle
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    notFound();
  }

  // Serialize all Decimal fields to numbers for client component
  const vehicleForClient = serializePrismaData(vehicle);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/vehicles/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-stroke hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-heading-5 font-bold text-dark dark:text-white">
            Edit Vehicle
          </h1>
          <p className="text-body-sm text-dark-5 dark:text-dark-6">
            Update vehicle information
          </p>
        </div>
      </div>

      <VehicleEditForm vehicle={vehicleForClient} />
    </div>
  );
}

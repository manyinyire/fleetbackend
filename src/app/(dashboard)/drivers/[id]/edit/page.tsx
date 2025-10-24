import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DriverEditForm } from '@/components/drivers/driver-edit-form';

export default async function EditDriverPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch driver
  const driver = await prisma.driver.findUnique({
    where: { id: params.id },
  });

  if (!driver) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/drivers/${params.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-stroke hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-heading-5 font-bold text-dark dark:text-white">
            Edit Driver
          </h1>
          <p className="text-body-sm text-dark-5 dark:text-dark-6">
            Update driver information
          </p>
        </div>
      </div>

      <DriverEditForm driver={driver} />
    </div>
  );
}

import { DriverForm } from '@/components/drivers/driver-form';
import { requireTenantForDashboard } from '@/lib/auth-helpers';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function NewDriverPage() {
  await requireTenantForDashboard();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/drivers"
          className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-stroke hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-heading-5 font-bold text-dark dark:text-white">
            Add New Driver
          </h1>
          <p className="text-body-sm text-dark-5 dark:text-dark-6">
            Add a new driver to your fleet
          </p>
        </div>
      </div>

      <DriverForm />
    </div>
  );
}

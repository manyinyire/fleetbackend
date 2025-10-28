import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { getInitials } from '@/lib/utils';
import Image from 'next/image';

export default async function ProfilePage() {
  const { user, tenantId } = await requireTenantForDashboard();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch tenant settings
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });

  let tenant: any = null;
  try {
    tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  } catch (error) {
    console.error('Tenant fetch failed (likely due to tenantId injection on Tenant model). Falling back to null:', error);
    tenant = null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-5 font-bold text-dark dark:text-white">
          Profile
        </h1>
        <p className="text-body-sm text-dark-5 dark:text-dark-6">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark lg:col-span-1">
                    <div className="flex flex-col items-center">
            <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-4xl font-bold text-white">
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <h3 className="mb-1 text-xl font-bold text-dark dark:text-white">
              {user.name}
            </h3>
            <p className="text-body-sm text-dark-5 dark:text-dark-6">
              {user.email}
            </p>
            <div className="mt-4">
                <span className="inline-flex rounded-full bg-blue-light-5 px-4 py-1.5 text-body-sm font-medium text-blue">
                  {(user as any).role?.replace(/_/g, ' ') || 'Unknown'}
                </span>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-stroke pt-6 dark:border-dark-3">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-dark-5 dark:text-dark-6">
                Email Verified
              </span>
              <span
                className={`text-body-sm font-medium ${
                  user.emailVerified ? 'text-green' : 'text-red'
                }`}
              >
                {user.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-dark-5 dark:text-dark-6">
                Member Since
              </span>
              <span className="text-body-sm font-medium text-dark dark:text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark lg:col-span-2">
          <div className="border-b border-stroke pb-4 dark:border-dark-3">
            <h3 className="text-lg font-bold text-dark dark:text-white">
              Account Information
            </h3>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                  Full Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                  Role
                </label>
                <input
                  type="text"
                  value={(user as any).role?.replace(/_/g, ' ') || 'Unknown'}
                  disabled
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                  Company
                </label>
                <input
                  type="text"
                  value={tenantSettings?.companyName || tenant?.name || '-'}
                  disabled
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>

            <div className="rounded-[10px] bg-yellow-light-4 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-yellow-dark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-body-sm font-medium text-yellow-dark-2">
                    Profile Edit Functionality Coming Soon
                  </p>
                  <p className="mt-1 text-body-xs text-yellow-dark-2">
                    The ability to edit your profile information will be available
                    in a future update. For now, please contact your administrator
                    to make changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Information */}
      {tenant && (
        <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
          <div className="border-b border-stroke pb-4 dark:border-dark-3">
            <h3 className="text-lg font-bold text-dark dark:text-white">
              Organization Information
            </h3>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Company Name
              </label>
              <input
                type="text"
                value={tenantSettings?.companyName || tenant.name}
                disabled
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Email
              </label>
              <input
                type="email"
                value={tenantSettings?.email || tenant.email}
                disabled
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Phone
              </label>
              <input
                type="text"
                value={tenantSettings?.phone || tenant.phone || '-'}
                disabled
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Plan
              </label>
              <input
                type="text"
                value={tenant.plan}
                disabled
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Status
              </label>
              <span
                className={`inline-flex rounded-full px-4 py-2 text-body-sm font-medium ${
                  tenant.status === 'ACTIVE'
                    ? 'bg-green-light-6 text-green'
                    : tenant.status === 'SUSPENDED'
                    ? 'bg-yellow-light-4 text-yellow-dark'
                    : 'bg-red-light-5 text-red'
                }`}
              >
                {tenant.status}
              </span>
            </div>

            <div>
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Member Since
              </label>
              <input
                type="text"
                value={new Date(tenant.createdAt).toLocaleDateString()}
                disabled
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

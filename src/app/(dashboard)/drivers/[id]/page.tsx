import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { AssignVehicleButton } from '@/components/drivers/assign-vehicle-button';

export default async function DriverDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch driver with all related data
  const driver = await prisma.driver.findUnique({
    where: { id: params.id },
    include: {
      vehicles: {
        include: {
          vehicle: true,
        },
        orderBy: { startDate: 'desc' },
      },
      remittances: {
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          vehicle: true,
        },
      },
      contracts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!driver) {
    notFound();
  }

  // Fetch available vehicles for assignment (not currently assigned to any driver)
  const availableVehicles = await prisma.vehicle.findMany({
    where: {
      status: 'ACTIVE',
      drivers: {
        none: {
          endDate: null, // No active assignments
        },
      },
    },
    orderBy: { registrationNumber: 'asc' },
  });

  const stats = {
    totalRemittances: driver.remittances.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    ),
    pendingRemittances: driver.remittances.filter((r) => r.status === 'PENDING')
      .length,
    activeVehicles: driver.vehicles.filter((v) => !v.endDate).length,
    totalContracts: driver.contracts.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-light-6 text-green';
      case 'INACTIVE':
        return 'bg-yellow-light-4 text-yellow-dark';
      case 'TERMINATED':
        return 'bg-red-light-5 text-red';
      default:
        return 'bg-gray-2 text-dark';
    }
  };

  const getPaymentModelLabel = (model: string) => {
    switch (model) {
      case 'OWNER_PAYS':
        return 'Owner Pays';
      case 'DRIVER_REMITS':
        return 'Driver Remits';
      case 'HYBRID':
        return 'Hybrid';
      default:
        return model;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/drivers"
            className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-stroke hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-heading-5 font-bold text-dark dark:text-white">
              {driver.fullName}
            </h1>
            <p className="text-body-sm text-dark-5 dark:text-dark-6">
              {driver.phone} {driver.email && `• ${driver.email}`}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <AssignVehicleButton
            driverId={driver.id}
            availableVehicles={availableVehicles}
          />
          <Link
            href={`/drivers/${driver.id}/edit`}
            className="inline-flex items-center gap-2 rounded-[7px] bg-primary px-4.5 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
          >
            <PencilIcon className="h-5 w-5" />
            Edit Driver
          </Link>
        </div>
      </div>

      {/* Driver Info Card */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Driver Information
          </h3>
        </div>
        <div className="p-7">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Full Name
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.fullName}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                National ID
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.nationalId}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Phone</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.phone}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Email</p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.email || '-'}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                License Number
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.licenseNumber}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-body-sm font-medium ${getStatusColor(
                  driver.status
                )}`}
              >
                {driver.status}
              </span>
            </div>
            <div className="sm:col-span-2">
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Home Address
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.homeAddress}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Payment Model
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {getPaymentModelLabel(driver.paymentModel)}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Debt Balance
              </p>
              <p
                className={`mt-1 font-medium ${
                  Number(driver.debtBalance) > 0
                    ? 'text-red'
                    : 'text-dark dark:text-white'
                }`}
              >
                ${Number(driver.debtBalance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Emergency Contact
          </h3>
        </div>
        <div className="p-7">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Next of Kin
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.nextOfKin}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-dark-5 dark:text-dark-6">
                Next of Kin Phone
              </p>
              <p className="mt-1 font-medium text-dark dark:text-white">
                {driver.nextOfKinPhone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Defensive License */}
      {driver.hasDefensiveLicense && (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
          <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
            <h3 className="font-medium text-dark dark:text-white">
              Defensive Driver's License
            </h3>
          </div>
          <div className="p-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-body-sm text-dark-5 dark:text-dark-6">
                  License Number
                </p>
                <p className="mt-1 font-medium text-dark dark:text-white">
                  {driver.defensiveLicenseNumber || '-'}
                </p>
              </div>
              <div>
                <p className="text-body-sm text-dark-5 dark:text-dark-6">
                  Expiry Date
                </p>
                <p className="mt-1 font-medium text-dark dark:text-white">
                  {driver.defensiveLicenseExpiry
                    ? new Date(driver.defensiveLicenseExpiry).toLocaleDateString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Pending
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.pendingRemittances}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Active Vehicles
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.activeVehicles}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-body-xs text-dark-5 dark:text-dark-6">
                Contracts
              </p>
              <p className="text-heading-6 font-bold text-dark dark:text-white">
                {stats.totalContracts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Vehicles */}
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
        <div className="px-4 py-6 md:px-6 xl:px-9">
          <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
            Assigned Vehicles
          </h4>
        </div>
        <div className="p-7 pt-0">
          {driver.vehicles.length === 0 ? (
            <p className="text-center text-dark-5 py-8">No vehicles assigned</p>
          ) : (
            <div className="space-y-3">
              {driver.vehicles.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-[7px] border border-stroke p-4 dark:border-dark-3"
                >
                  <div>
                    <p className="font-medium text-dark dark:text-white">
                      {assignment.vehicle.registrationNumber}
                    </p>
                    <p className="text-body-sm text-dark-5 dark:text-dark-6">
                      {assignment.vehicle.make} {assignment.vehicle.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm text-dark-5 dark:text-dark-6">
                      From {new Date(assignment.startDate).toLocaleDateString()}
                    </p>
                    {assignment.endDate ? (
                      <p className="text-body-sm text-red">
                        To {new Date(assignment.endDate).toLocaleDateString()}
                      </p>
                    ) : (
                      <span className="mt-1 inline-flex rounded-full bg-green-light-6 px-3 py-1 text-body-xs font-medium text-green">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Remittances */}
      {driver.remittances.length > 0 && (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark">
          <div className="px-4 py-6 md:px-6 xl:px-9">
            <h4 className="text-body-2xlg font-bold text-dark dark:text-white">
              Recent Remittances
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
                    Amount
                  </th>
                  <th className="px-4 py-5 text-left font-medium text-dark dark:text-white">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {driver.remittances.map((remittance) => (
                  <tr
                    key={remittance.id}
                    className="border-t border-stroke dark:border-dark-3"
                  >
                    <td className="px-4 py-5">
                      {new Date(remittance.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-5">
                      {remittance.vehicle.registrationNumber}
                    </td>
                    <td className="px-4 py-5">
                      ${Number(remittance.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-body-sm font-medium ${
                          remittance.status === 'APPROVED'
                            ? 'bg-green-light-6 text-green'
                            : remittance.status === 'PENDING'
                            ? 'bg-yellow-light-4 text-yellow-dark'
                            : 'bg-red-light-5 text-red'
                        }`}
                      >
                        {remittance.status}
                      </span>
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

import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { approveRemittance, rejectRemittance } from '@/server/actions/remittances';

export default async function RemittanceDetailPage({
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

  // Fetch remittance with related data
  const remittance = await prisma.remittance.findUnique({
    where: { id },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  if (!remittance) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/remittances"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Remittances
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/remittances/${id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          {remittance.status === 'PENDING' && (
            <>
              <form action={async () => {
                'use server';
                await approveRemittance(id);
              }} className="inline">
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Approve
                </button>
              </form>
              <form action={async () => {
                'use server';
                await rejectRemittance(id);
              }} className="inline">
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Reject
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Remittance Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                Created on {formatDate(remittance.createdAt)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatCurrency(Number(remittance.amount))}
                </dd>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(remittance.status)}`}>
                    {remittance.status}
                  </span>
                </dd>
              </div>

              {/* Date */}
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-lg font-medium text-gray-900">
                  {formatDate(remittance.date)}
                </dd>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Driver Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.driver.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.driver.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.driver.email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">License Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.driver.licenseNumber}</dd>
                  </div>
                </dl>
              </div>

              {/* Vehicle Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.vehicle.registrationNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Make & Model</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.vehicle.make} {remittance.vehicle.model}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Year</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.vehicle.year}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{remittance.vehicle.type}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Additional Information */}
            {(remittance.notes || remittance.proofOfPayment) && (
              <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <dl className="space-y-3">
                  {remittance.notes && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Notes</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{remittance.notes}</dd>
                    </div>
                  )}
                  {remittance.proofOfPayment && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Proof of Payment</dt>
                      <dd className="mt-1">
                        <a
                          href={remittance.proofOfPayment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          View proof of payment
                        </a>
                      </dd>
                    </div>
                  )}
                  {remittance.approvedBy && remittance.approvedAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Approved</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(remittance.approvedAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

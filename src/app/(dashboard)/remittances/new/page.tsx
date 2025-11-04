import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaArray } from '@/lib/serialize-prisma';
import { RemittanceForm } from '@/components/finances/remittance-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function NewRemittancePage() {
  const { user, tenantId } = await requireTenantForDashboard();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch drivers with their vehicle assignments and payment config
  const driversRaw = await prisma.driver.findMany({
    where: { status: 'ACTIVE' },
    include: {
      vehicles: {
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              make: true,
              model: true,
              paymentModel: true,
              paymentConfig: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      },
    },
    orderBy: { fullName: 'asc' },
  });

  // Serialize all Decimal fields to numbers for client components
  const drivers = serializePrismaArray(driversRaw) as typeof driversRaw;

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
      </div>

      <div className="max-w-3xl">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Remittance</h1>
            <RemittanceForm 
              drivers={drivers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

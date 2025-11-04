import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaData, serializePrismaArray } from '@/lib/serialize-prisma';
import { notFound } from 'next/navigation';
import { RemittanceForm } from '@/components/finances/remittance-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function EditRemittancePage({
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
  const remittanceRaw = await prisma.remittance.findUnique({
    where: { id },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  if (!remittanceRaw) {
    notFound();
  }

  // Fetch drivers with their vehicle assignments
  const driversRaw = await prisma.driver.findMany({
    where: { status: 'ACTIVE' },
    include: {
      vehicles: {
        include: {
          vehicle: true,
        },
        orderBy: { startDate: 'desc' },
      },
    },
    orderBy: { fullName: 'asc' },
  });

  // Serialize all Decimal fields to numbers for client components
  const remittance = serializePrismaData(remittanceRaw);
  const drivers = serializePrismaArray(driversRaw);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/remittances/${id}`}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Remittance Details
          </Link>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Remittance</h1>
            <RemittanceForm 
              drivers={drivers}
              remittance={remittance}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

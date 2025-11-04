import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { VehiclesTable } from '@/components/vehicles/vehicles-table';
import { serializePrismaArray } from '@/lib/serialize-prisma';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

export default async function VehiclesPage() {
  const { user, tenantId } = await requireTenantForDashboard();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  let vehicles;
  try {
    // Fetch vehicles with related data
    vehicles = await prisma.vehicle.findMany({
      include: {
        drivers: {
          include: {
            driver: true
          }
        },
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          take: 3
        },
        _count: {
          select: {
            remittances: true,
            expenses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      where: {
        tenantId: tenantId
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    vehicles = [];
  }

  // Serialize all Decimal fields to numbers for client components
  const vehiclesForClient = serializePrismaArray(vehicles) as typeof vehicles;

  // Debug: Log the data
  console.log('Vehicles page - vehicles count:', vehicles.length);
  console.log('Vehicles page - vehiclesForClient count:', vehiclesForClient.length);
  console.log('Vehicles page - first vehicle:', vehicles[0]);
  console.log('Vehicles page - first vehicleForClient:', vehiclesForClient[0]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-2 text-gray-600">
            Manage your fleet vehicles, maintenance, and assignments.
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Vehicle
        </Link>
      </div>

      <VehiclesTable vehicles={vehiclesForClient} />
    </div>
  );
}
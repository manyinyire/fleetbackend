import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaArray, serializePrismaData } from '@/lib/serialize-prisma';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { FleetStats } from '@/components/dashboard/fleet-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default async function DashboardPage() {
  const { user, tenantId } = await requireTenantForDashboard();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch tenant information - use regular Prisma client since Tenant is not tenant-scoped
  const { prisma: regularPrisma } = await import('@/lib/prisma');
  let tenant: { name: string } | null = null;
  try {
    tenant = await regularPrisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true }
    });
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
  }

  // Fetch dashboard data with optimized queries
  const [
    vehicles,
    drivers,
    recentRemittances,
    recentMaintenance,
    totalExpenses,
    totalIncome,
    vehicleCounts,
    driverCounts
  ] = await Promise.all([
    // Get vehicles with minimal data - only what's needed for overview
    prisma.vehicle.findMany({
      select: {
        id: true,
        make: true,
        model: true,
        licensePlate: true,
        status: true,
        fuelType: true,
        createdAt: true
      },
      where: {
        tenantId: tenantId
      },
      take: 100, // Limit to prevent huge loads
      orderBy: { createdAt: 'desc' }
    }),
    // Get drivers with minimal data
    prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        licenseNumber: true,
        status: true,
        createdAt: true
      },
      where: {
        tenantId: tenantId
      },
      take: 100, // Limit to prevent huge loads
      orderBy: { createdAt: 'desc' }
    }),
    // Get recent remittances with essential relations
    prisma.remittance.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true
          }
        }
      },
      where: {
        tenantId: tenantId
      }
    }),
    // Get recent maintenance with essential vehicle info
    prisma.maintenanceRecord.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        type: true,
        cost: true,
        date: true,
        createdAt: true,
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true
          }
        }
      },
      where: {
        tenantId: tenantId
      }
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        status: 'APPROVED',
        tenantId: tenantId
      }
    }),
    prisma.income.aggregate({
      _sum: { amount: true },
      where: {
        tenantId: tenantId
      }
    }),
    // Get counts for pagination info
    prisma.vehicle.count({
      where: { tenantId: tenantId }
    }),
    prisma.driver.count({
      where: { tenantId: tenantId }
    })
  ]);

  const stats = serializePrismaData({
    totalVehicles: vehicleCounts,
    activeVehicles: vehicles.filter((v: any) => v.status === 'ACTIVE').length,
    totalDrivers: driverCounts,
    activeDrivers: drivers.filter((d: any) => d.status === 'ACTIVE').length,
    totalExpenses: totalExpenses._sum.amount || 0,
    totalIncome: totalIncome._sum.amount || 0,
    pendingRemittances: recentRemittances.filter((r: any) => r.status === 'PENDING').length,
    hasMoreVehicles: vehicleCounts > 100,
    hasMoreDrivers: driverCounts > 100
  });

  return (
    <div className="space-y-8">
      <FleetStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardOverview
            vehicles={serializePrismaArray(vehicles)}
            drivers={serializePrismaArray(drivers)}
          />
        </div>

        <div className="space-y-8">
          <QuickActions />
          <RecentActivity
            remittances={serializePrismaArray(recentRemittances)}
            maintenance={serializePrismaArray(recentMaintenance)}
          />
        </div>
      </div>
    </div>
  );
}
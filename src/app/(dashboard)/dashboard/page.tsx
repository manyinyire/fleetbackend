import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
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

  // Fetch dashboard data
  const [
    vehicles,
    drivers,
    recentRemittances,
    recentMaintenance,
    totalExpenses,
    totalIncome
  ] = await Promise.all([
    prisma.vehicle.findMany({
      include: {
        drivers: {
          include: {
            driver: true
          }
        }
      },
      where: {
        tenantId: tenantId
      }
    }),
    prisma.driver.findMany({
      include: {
        vehicles: {
          include: {
            vehicle: true
          }
        }
      },
      where: {
        tenantId: tenantId
      }
    }),
    prisma.remittance.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: true,
        vehicle: true
      },
      where: {
        tenantId: tenantId
      }
    }),
    prisma.maintenanceRecord.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        vehicle: true
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
    })
  ]);

  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v: any) => v.status === 'ACTIVE').length,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter((d: any) => d.status === 'ACTIVE').length,
    totalExpenses: totalExpenses._sum.amount || 0,
    totalIncome: totalIncome._sum.amount || 0,
    pendingRemittances: recentRemittances.filter((r: any) => r.status === 'PENDING').length
  };

  return (
    <div className="space-y-8">
      <FleetStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardOverview 
            vehicles={vehicles}
            drivers={drivers}
          />
        </div>
        
        <div className="space-y-8">
          <QuickActions />
          <RecentActivity 
            remittances={recentRemittances}
            maintenance={recentMaintenance}
          />
        </div>
      </div>
    </div>
  );
}
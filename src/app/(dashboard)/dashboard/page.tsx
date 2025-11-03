import { requireTenantForDashboard } from "@/lib/auth-helpers";
import { getTenantPrisma } from "@/lib/get-tenant-prisma";
import { setTenantContext } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import { TenantStats } from "@/components/dashboard/TenantStats";
import { TenantVehiclesDrivers } from "@/components/dashboard/TenantVehiclesDrivers";
import { TenantRecentActivity } from "@/components/dashboard/TenantRecentActivity";
import { TenantQuickActions } from "@/components/dashboard/TenantQuickActions";
import { Grid, GridItem, Stack } from "@chakra-ui/react";

export default async function DashboardPage() {
  const { tenantId } = await requireTenantForDashboard();

  await setTenantContext(tenantId);

  const prisma = getTenantPrisma(tenantId);

  const [vehicles, drivers, recentRemittances, recentMaintenance, totalExpenses, totalIncome] = await Promise.all([
    prisma.vehicle.findMany({
      include: {
        drivers: {
          include: {
            driver: true,
          },
        },
      },
      where: { tenantId },
    }),
    prisma.driver.findMany({
      include: {
        vehicles: {
          include: {
            vehicle: true,
          },
        },
      },
      where: { tenantId },
    }),
    prisma.remittance.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        driver: true,
        vehicle: true,
      },
      where: { tenantId },
    }),
    prisma.maintenanceRecord.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        vehicle: true,
      },
      where: { tenantId },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        status: "APPROVED",
        tenantId,
      },
    }),
    prisma.income.aggregate({
      _sum: { amount: true },
      where: { tenantId },
    }),
  ]);

  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter((driver) => driver.status === "ACTIVE").length,
    totalExpenses: Number(totalExpenses._sum.amount ?? 0),
    totalIncome: Number(totalIncome._sum.amount ?? 0),
    pendingRemittances: recentRemittances.filter((remittance) => remittance.status === "PENDING").length,
  };

  return (
    <Stack spacing={10}>
      <PageHeader
        title="Fleet Overview"
        description="Monitor operational health across vehicles, drivers, finances, and maintenance."
      />

      <TenantStats stats={stats} />

      <Grid templateColumns={{ base: "1fr", xl: "3fr 2fr" }} gap={6} alignItems="start">
        <GridItem>
          <TenantVehiclesDrivers vehicles={vehicles} drivers={drivers} />
        </GridItem>
        <GridItem>
          <Stack spacing={6}>
            <TenantQuickActions />
            <TenantRecentActivity remittances={recentRemittances} maintenance={recentMaintenance} />
          </Stack>
        </GridItem>
      </Grid>
    </Stack>
  );
}
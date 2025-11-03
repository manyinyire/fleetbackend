import { requireTenantForDashboard } from "@/lib/auth-helpers";
import { getTenantPrisma } from "@/lib/get-tenant-prisma";
import { setTenantContext } from "@/lib/tenant";
import { VehiclesTable } from "@/components/vehicles/vehicles-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { Plus } from "lucide-react";

export default async function VehiclesPage() {
  const { tenantId } = await requireTenantForDashboard();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch vehicles with related data
  const vehicles = await prisma.vehicle.findMany({
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

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Vehicles"
        description="Manage your fleet inventory, assignments, and maintenance history."
        actions={
          <Button as={NextLink} href="/vehicles/new" leftIcon={<Plus size={16} />} colorScheme="brand">
            Add Vehicle
          </Button>
        }
      />

      <VehiclesTable vehicles={vehicles} />
    </Stack>
  );
}
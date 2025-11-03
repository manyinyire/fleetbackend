import { requireTenantForDashboard } from "@/lib/auth-helpers";
import { getTenantPrisma } from "@/lib/get-tenant-prisma";
import { setTenantContext } from "@/lib/tenant";
import { DriversTable } from "@/components/drivers/drivers-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { Plus } from "lucide-react";

export default async function DriversPage() {
  const { tenantId } = await requireTenantForDashboard();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch drivers with related data
  const drivers = await prisma.driver.findMany({
    include: {
      vehicles: {
        include: {
          vehicle: true
        }
      },
      remittances: {
        orderBy: { date: 'desc' },
        take: 3
      },
      _count: {
        select: {
          remittances: true,
          contracts: true
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
        title="Drivers"
        description="Track driver assignments, payment models, and remittance performance."
        actions={
          <Button as={NextLink} href="/drivers/new" leftIcon={<Plus size={16} />} colorScheme="brand">
            Add Driver
          </Button>
        }
      />

      <DriversTable drivers={drivers} />
    </Stack>
  );
}
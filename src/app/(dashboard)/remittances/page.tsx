import { requireTenantForDashboard } from "@/lib/auth-helpers";
import { getTenantPrisma } from "@/lib/get-tenant-prisma";
import { setTenantContext } from "@/lib/tenant";
import { RemittancesTable } from "@/components/finances/remittances-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Button, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { CheckCircle2, Clock, DollarSign, Plus, XCircle } from "lucide-react";

export default async function RemittancesPage() {
  const { tenantId } = await requireTenantForDashboard();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch remittances with related data
  const remittances = await prisma.remittance.findMany({
    include: {
      driver: true,
      vehicle: true,
    },
    orderBy: { date: 'desc' },
    where: {
      tenantId: tenantId
    }
  });

  const stats = {
    total: remittances.length,
    pending: remittances.filter((r: any) => r.status === 'PENDING').length,
    approved: remittances.filter((r: any) => r.status === 'APPROVED').length,
    rejected: remittances.filter((r: any) => r.status === 'REJECTED').length,
    totalAmount: remittances
      .filter((r: any) => r.status === 'APPROVED')
      .reduce((sum: any, r: any) => sum + Number(r.amount), 0),
  };

  const statCards = [
    {
      label: "Approved",
      value: stats.approved,
      helper: `${stats.totalAmount.toLocaleString()} USD approved`,
      icon: CheckCircle2,
    },
    {
      label: "Pending",
      value: stats.pending,
      helper: `${stats.total - stats.approved - stats.rejected} awaiting review`,
      icon: Clock,
    },
    {
      label: "Rejected",
      value: stats.rejected,
      helper: "Need follow-up",
      icon: XCircle,
    },
    {
      label: "Approved Amount",
      value: `$${stats.totalAmount.toLocaleString()}`,
      helper: `${stats.total} total submissions`,
      icon: DollarSign,
    },
  ];

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Remittances"
        description="Manage driver remittances and track payment status across your fleet."
        actions={
          <Button as={NextLink} href="/remittances/new" leftIcon={<Plus size={16} />} colorScheme="brand">
            Add Remittance
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helperText={card.helper} icon={card.icon} />
        ))}
      </SimpleGrid>

      <Stack spacing={4}>
        <Text fontSize="lg" fontWeight="semibold">
          Recent Remittances
        </Text>
        <RemittancesTable remittances={remittances} />
      </Stack>
    </Stack>
  );
}

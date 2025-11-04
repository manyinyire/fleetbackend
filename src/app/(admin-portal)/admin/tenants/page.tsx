import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Badge,
  Box,
  Button,
  HStack,
  Link,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";

export default async function TenantsPage() {
  await requireRole("SUPER_ADMIN");

  const tenants = await prisma.tenant.findMany({
    include: {
      users: { select: { id: true } },
      _count: { select: { vehicles: true, drivers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "ACTIVE").length,
    suspended: tenants.filter((t) => t.status === "SUSPENDED").length,
    cancelled: tenants.filter((t) => t.status === "CANCELED").length,
  };

  const statCards = [
    { label: "Total Tenants", value: stats.total, helperText: `${stats.active} active` },
    { label: "Active", value: stats.active, helperText: `${stats.suspended} suspended` },
    { label: "Suspended", value: stats.suspended, helperText: `${stats.cancelled} cancelled` },
    { label: "Cancelled", value: stats.cancelled, helperText: `${stats.total - stats.cancelled} live` },
  ];

  const tableBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Tenant Management"
        description="Manage tenant lifecycle, plans, and operational status."
        actions={
          <Button colorScheme="brand" as={Link} href="/admin/tenants/new">
            New Tenant
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helperText={card.helperText} />
        ))}
      </SimpleGrid>

      <Box bg={tableBg} borderWidth="1px" borderRadius="2xl" borderColor={border} p={6}>
        <HStack justify="space-between" mb={4}>
          <Stack spacing={1}>
            <Text fontWeight="semibold">All Tenants</Text>
            <Text fontSize="sm" color="gray.500">
              Showing {tenants.length} organisations
            </Text>
          </Stack>
        </HStack>

        {tenants.length === 0 ? (
          <EmptyState
            title="No tenants yet"
            description="Create a tenant to begin onboarding organisations to the platform."
          />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                  <Tr>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Plan</Th>
                  <Th isNumeric>Users</Th>
                  <Th isNumeric>Vehicles</Th>
                  <Th isNumeric>Drivers</Th>
                  <Th isNumeric>MRR</Th>
                    <Th textAlign="right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tenants.map((tenant) => (
                  <Tr key={tenant.id} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}>
                    <Td>
                      <Stack spacing={0}>
                        <Link href={`/admin/tenants/${tenant.id}`} fontWeight="medium" color="brand.600">
                          {tenant.name}
                        </Link>
                        <Text fontSize="sm" color="gray.500">
                          Created {new Date(tenant.createdAt).toLocaleDateString()}
                        </Text>
                      </Stack>
                    </Td>
                    <Td>
                      <Badge colorScheme={tenant.status === "ACTIVE" ? "green" : tenant.status === "SUSPENDED" ? "yellow" : "red"}>
                        {tenant.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={tenant.plan === "PREMIUM" ? "purple" : tenant.plan === "BASIC" ? "blue" : "gray"}>
                        {tenant.plan}
                      </Badge>
                    </Td>
                    <Td isNumeric>{tenant.users.length}</Td>
                    <Td isNumeric>{tenant._count.vehicles}</Td>
                    <Td isNumeric>{tenant._count.drivers}</Td>
                    <Td isNumeric>${Number(tenant.monthlyRevenue).toLocaleString()}</Td>
                      <Td textAlign="right">
                        <Button as={Link} href={`/admin/tenants/${tenant.id}`} size="sm" variant="outline" colorScheme="brand">
                          Manage
                        </Button>
                      </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
}

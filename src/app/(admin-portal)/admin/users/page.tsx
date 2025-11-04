import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Badge,
  Box,
  Button,
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

export default async function UsersPage() {
  await requireRole("SUPER_ADMIN");

  const users = await prisma.user.findMany({
    include: {
      tenant: { select: { name: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: users.length,
    superAdmins: users.filter((u) => u.role === "SUPER_ADMIN").length,
    tenantAdmins: users.filter((u) => u.role === "TENANT_ADMIN").length,
    regularUsers: users.filter((u) => !["SUPER_ADMIN", "TENANT_ADMIN"].includes(u.role)).length,
  };

  const statCards = [
    { label: "Total Users", value: stats.total, helperText: `${stats.superAdmins} super admins` },
    { label: "Super Admins", value: stats.superAdmins, helperText: `${stats.tenantAdmins} tenant admins` },
    { label: "Tenant Admins", value: stats.tenantAdmins, helperText: `${stats.regularUsers} other roles` },
    { label: "Regular Users", value: stats.regularUsers, helperText: `Total accounts ${stats.total}` },
  ];

  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");

  return (
    <Stack spacing={8}>
      <PageHeader
        title="User Management"
        description="Manage all users across the platform."
        actions={
          <Button as={Link} href="/admin/users/new" colorScheme="brand">
            Add User
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helperText={card.helperText} />
        ))}
      </SimpleGrid>

      <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
        <Stack spacing={2} mb={4}>
          <Text fontWeight="semibold">All Users</Text>
          <Text fontSize="sm" color="gray.500">
            Showing {users.length} accounts
          </Text>
        </Stack>

        {users.length === 0 ? (
          <EmptyState title="No users found" description="Invite your first user to get started." />
        ) : (
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Tenant</Th>
                  <Th>Joined</Th>
                  <Th>Verification</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id} _hover={{ bg: useColorModeValue("gray.50", "whiteAlpha.50") }}>
                    <Td>{user.name}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Badge colorScheme={user.role === "SUPER_ADMIN" ? "purple" : user.role === "TENANT_ADMIN" ? "green" : "gray"}>
                        {user.role.replace("_", " ")}
                      </Badge>
                    </Td>
                    <Td>
                      {user.tenant ? (
                        <Badge colorScheme={user.tenant.status === "ACTIVE" ? "green" : "yellow"}>{user.tenant.name}</Badge>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          None
                        </Text>
                      )}
                    </Td>
                    <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <Badge colorScheme={user.emailVerified ? "green" : "red"}>
                        {user.emailVerified ? "Verified" : "Pending"}
                      </Badge>
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

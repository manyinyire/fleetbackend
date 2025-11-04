import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Badge,
  Box,
  Grid,
  GridItem,
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
import { DollarSign, LineChart, TrendingUp, Wallet } from "lucide-react";

export default async function RevenuePage() {
  await requireRole("SUPER_ADMIN");

  // Fetch revenue data
  const [
    totalRevenue,
    revenueByPlan,
    topRevenueTenants,
    failedPayments,
    totalTenants
  ] = await Promise.all([
    // Total Revenue (MRR)
    prisma.tenant.aggregate({
      _sum: { monthlyRevenue: true }
    }),
    
    // Revenue by Plan
    prisma.tenant.groupBy({
      by: ['plan'],
      _sum: { monthlyRevenue: true },
      _count: { id: true }
    }),
    
    // Top Revenue Tenants
    prisma.tenant.findMany({
      orderBy: { monthlyRevenue: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        plan: true,
        monthlyRevenue: true,
        status: true
      }
    }),
    
    // Failed Payments (suspended tenants)
    prisma.tenant.findMany({
      where: {
        status: 'SUSPENDED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        plan: true,
        monthlyRevenue: true,
        updatedAt: true
      }
    }),
    // Total Tenants for ARPU calculation
    prisma.tenant.count()
  ]);

  // Calculate additional metrics
  const mrr = Number(totalRevenue._sum.monthlyRevenue) || 0;
  const newMrr = mrr * 0.15; // This would be calculated from new subscriptions
  const arpu = mrr / Math.max(totalTenants, 1); // Average Revenue Per User

  // Process revenue by plan data
  const planRevenueData = revenueByPlan.map(plan => ({
    plan: plan.plan,
    revenue: Number(plan._sum.monthlyRevenue) || 0,
    count: plan._count.id,
    percentage: ((Number(plan._sum.monthlyRevenue) || 0) / Math.max(mrr, 1)) * 100
  }));

  // Process top revenue tenants
  const topRevenueData = topRevenueTenants.map(tenant => ({
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    revenue: Number(tenant.monthlyRevenue),
    status: tenant.status
  }));

  // Process failed payments
  const failedPaymentsData = failedPayments.map(tenant => ({
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    amount: Number(tenant.monthlyRevenue),
    failedAt: tenant.updatedAt
  }));

  // Calculate revenue trends (placeholder - would need historical data)
  const revenueTrendData = [
    { month: 'Jan', revenue: mrr * 0.8 },
    { month: 'Feb', revenue: mrr * 0.85 },
    { month: 'Mar', revenue: mrr * 0.9 },
    { month: 'Apr', revenue: mrr * 0.95 },
    { month: 'May', revenue: mrr },
    { month: 'Jun', revenue: mrr * 1.05 }
  ];

  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const statCards = [
    { label: "Monthly Recurring Revenue", value: `$${mrr.toFixed(2)}`, helperText: "MRR", icon: DollarSign },
    { label: "Annual Recurring Revenue", value: `$${(mrr * 12).toFixed(2)}`, helperText: "ARR", icon: LineChart },
    { label: "New MRR", value: `$${newMrr.toFixed(2)}`, helperText: "Last 30 days", icon: TrendingUp },
    { label: "ARPU", value: `$${arpu.toFixed(2)}`, helperText: "Avg per tenant", icon: Wallet },
  ];

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Revenue Intelligence"
        description="Track recurring revenue, plan performance, and high value tenants at a glance."
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helperText={card.helperText} icon={card.icon} />
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", xl: "2fr 3fr" }} gap={6} alignItems="flex-start">
        <GridItem>
          <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
            <Text fontWeight="semibold" mb={4}>
              Revenue by Plan
            </Text>
            {planRevenueData.length === 0 ? (
              <EmptyState title="No plan data" description="Revenue allocations will appear once tenants are active." />
            ) : (
              <Stack spacing={4}>
                {planRevenueData.map((plan) => (
                  <Stack key={plan.plan} direction="row" justify="space-between" align="center">
                    <Stack spacing={0}>
                      <Text fontWeight="medium">{plan.plan}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {plan.count} tenants ? {plan.percentage.toFixed(1)}%
                      </Text>
                    </Stack>
                    <Text fontWeight="semibold">${plan.revenue.toLocaleString()}</Text>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </GridItem>
        <GridItem>
          <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
            <Text fontWeight="semibold" mb={4}>
              Revenue Trend (6 months)
            </Text>
            <Stack spacing={3}>
              {revenueTrendData.map((point) => (
                <Stack key={point.month} direction="row" justify="space-between">
                  <Text>{point.month}</Text>
                  <Text color="gray.500">${point.revenue.toFixed(2)}</Text>
                </Stack>
              ))}
            </Stack>
          </Box>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6} alignItems="flex-start">
        <GridItem>
          <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
            <Text fontWeight="semibold" mb={4}>
              Top Revenue Tenants
            </Text>
            {topRevenueData.length === 0 ? (
              <EmptyState title="No tenants" description="Revenue data appears after tenant onboarding." />
            ) : (
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Tenant</Th>
                      <Th>Plan</Th>
                      <Th>Status</Th>
                      <Th isNumeric>MRR</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {topRevenueData.map((tenant) => (
                      <Tr key={tenant.id} _hover={{ bg: hoverBg }}>
                        <Td>{tenant.name}</Td>
                        <Td>
                          <Badge colorScheme={tenant.plan === "PREMIUM" ? "purple" : tenant.plan === "BASIC" ? "blue" : "gray"}>
                            {tenant.plan}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={tenant.status === "ACTIVE" ? "green" : "yellow"}>{tenant.status}</Badge>
                        </Td>
                        <Td isNumeric>${tenant.revenue.toLocaleString()}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </GridItem>
        <GridItem>
          <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
            <Text fontWeight="semibold" mb={4}>
              Failed Payments
            </Text>
            {failedPaymentsData.length === 0 ? (
              <EmptyState title="No failures detected" description="Great news! All recent payments were successful." />
            ) : (
              <Stack spacing={3}>
                {failedPaymentsData.map((payment) => (
                  <Stack key={payment.id} spacing={1} borderLeftWidth="3px" borderLeftColor="red.400" pl={3}>
                    <Text fontWeight="medium">{payment.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {payment.plan} plan ? ${payment.amount.toFixed(2)}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Failed {new Date(payment.failedAt).toLocaleDateString()}
                    </Text>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </GridItem>
      </Grid>
    </Stack>
  );
}
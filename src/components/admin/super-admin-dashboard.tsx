"use client";

import {
  Badge,
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowUpRight, DollarSign, LifeBuoy, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface DashboardData {
  kpis: {
    totalTenants: number;
    activeUsers: number;
    mrr: number;
    arr: number;
    churnRate: number;
    newMrr: number;
    arpu: number;
    ltv: number;
  };
  recentSignups: Array<{ id: string; name: string; email: string; plan: string; users: number; createdAt: Date }>;
  paymentFailures: Array<{ id: string; name: string; email: string; plan: string; users: number; suspendedAt: Date }>;
  supportTickets: Array<{ id: string; title: string; status: string; priority: string; createdAt: Date }>;
  systemAlerts: Array<{ id: string; type: string; title: string; message: string; timestamp: Date; acknowledged: boolean }>;
  revenueTrendData: Array<{ month: string; revenue: number }>;
  tenantGrowthData: Array<{ month: string; count: number }>;
}

interface SuperAdminDashboardProps {
  data: DashboardData;
}

const cardColor = {
  SUCCESS: "green",
  WARNING: "yellow",
  CRITICAL: "red",
  INFO: "blue",
};

type InfoCardProps = {
  title: string;
  tone?: "red" | "yellow" | "green" | "blue" | "gray";
  emptyLabel: string;
  items: Array<{ id: string; title: string; subtitle: string; timestamp: Date }>;
  actionLabel?: string;
  onAction?: () => void;
};

export function SuperAdminDashboard({ data }: SuperAdminDashboardProps) {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");

  const statCards = [
    {
      label: "Total Tenants",
      value: data.kpis.totalTenants,
      helperText: `${Math.round(data.kpis.newMrr ? (data.kpis.newMrr / Math.max(data.kpis.mrr, 1)) * 100 : 0)}% new this month`,
      icon: ArrowUpRight,
    },
    {
      label: "Active Users",
      value: data.kpis.activeUsers,
      helperText: `ARPU ${formatCurrency(data.kpis.arpu)}`,
      icon: TrendingUp,
    },
    {
      label: "Monthly Recurring Revenue",
      value: formatCurrency(data.kpis.mrr),
      helperText: `ARR ${formatCurrency(data.kpis.arr)}`,
      icon: DollarSign,
    },
    {
      label: "Churn Rate",
      value: `${data.kpis.churnRate.toFixed(1)}%`,
      helperText: `LTV ${formatCurrency(data.kpis.ltv)}`,
      icon: TrendingDown,
    },
  ];

  return (
    <Stack spacing={8}>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helperText={card.helperText} icon={card.icon} />
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", xl: "3fr 2fr" }} gap={6} alignItems="flex-start">
        <GridItem>
          <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="semibold">Revenue Trend</Text>
              <Badge colorScheme="brand">Last 6 months</Badge>
            </HStack>
            <Stack spacing={3}>
              {data.revenueTrendData.map((item) => (
                <HStack key={item.month} justify="space-between" spacing={4}>
                  <Text fontWeight="medium">{item.month}</Text>
                  <Text color="gray.500">{formatCurrency(item.revenue)}</Text>
                </HStack>
              ))}
            </Stack>
          </Box>
        </GridItem>
        <GridItem>
          <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="semibold">Tenant Growth</Text>
              <Badge colorScheme="brand" variant="subtle">
                {data.tenantGrowthData[data.tenantGrowthData.length - 1]?.count ?? 0} tenants
              </Badge>
            </HStack>
            <Stack spacing={3}>
              {data.tenantGrowthData.map((item) => (
                <HStack key={item.month} justify="space-between">
                  <Text>{item.month}</Text>
                  <Text color="gray.500">{item.count} tenants</Text>
                </HStack>
              ))}
            </Stack>
          </Box>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6}>
        <InfoCard
          title="Recent Signups"
          emptyLabel="No new tenants"
          items={data.recentSignups.map((tenant) => ({
            id: tenant.id,
            title: tenant.name,
            subtitle: `${tenant.plan} plan • ${tenant.users} users`,
            timestamp: tenant.createdAt,
          }))}
        />
        <InfoCard
          title="Payment Failures"
          tone="red"
          emptyLabel="No failures detected"
          items={data.paymentFailures.map((tenant) => ({
            id: tenant.id,
            title: tenant.name,
            subtitle: `${tenant.plan} plan • ${tenant.users} users`,
            timestamp: tenant.suspendedAt,
          }))}
        />
        <InfoCard
          title="Support Tickets"
          tone="yellow"
          actionLabel="View support"
          onAction={() => window.location.assign("/admin/support")}
          emptyLabel="No active tickets"
          items={data.supportTickets.map((ticket) => ({
            id: ticket.id,
            title: ticket.title,
            subtitle: `${ticket.priority} priority • ${ticket.status}`,
            timestamp: ticket.createdAt,
          }))}
        />
      </Grid>

      <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="semibold">System Alerts</Text>
          <Button size="sm" variant="ghost" colorScheme="brand" leftIcon={<LifeBuoy size={16} />}>
            View incident room
          </Button>
        </HStack>
        {data.systemAlerts.length === 0 ? (
          <EmptyState
            title="All systems normal"
            description="No alerts have been raised in the last 24 hours."
          />
        ) : (
          <Stack spacing={4}>
            {data.systemAlerts.map((alert) => {
              const tone = cardColor[alert.type as keyof typeof cardColor] ?? "gray";
              return (
                <HStack key={alert.id} align="flex-start" spacing={4}>
                  <Box bg={`${tone}.100`} color={`${tone}.600`} px={3} py={2} borderRadius="md">
                    {alert.type}
                  </Box>
                  <Stack spacing={1} flex="1">
                    <Text fontWeight="semibold">{alert.title}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {typeof alert.message === "string" ? alert.message : "System alert"}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </Text>
                  </Stack>
                </HStack>
              );
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function InfoCard({ title, tone = "gray", emptyLabel, items, actionLabel, onAction }: InfoCardProps) {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6} h="full">
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="semibold">{title}</Text>
        {actionLabel && onAction && (
          <Button size="sm" variant="ghost" colorScheme="brand" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </HStack>
      {items.length === 0 ? (
        <EmptyState title={emptyLabel} />
      ) : (
        <Stack spacing={4}>
          {items.map((item) => (
            <Box key={item.id} borderLeftWidth="3px" borderLeftColor={`${tone}.400`} pl={3}>
              <Text fontWeight="semibold">{item.title}</Text>
              <Text fontSize="sm" color={subtitleColor}>
                {item.subtitle}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </Text>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

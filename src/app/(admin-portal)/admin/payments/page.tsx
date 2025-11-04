"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
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
import { ArrowPath, CheckCircle2, CircleDot, DollarSign, RefreshCcw, Search, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  verified: boolean;
  reconciled: boolean;
  paynowReference: string | null;
  createdAt: string;
  verifiedAt: string | null;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    description: string;
    type: string;
  } | null;
}

interface PaymentStats {
  byStatus: Array<{
    status: string;
    _sum: { amount: string | null };
    _count: number;
  }>;
  totalRevenue: string;
  unreconciledCount: number;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "unreconciled", label: "Unreconciled" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") {
        if (filter === "verified") params.set("verified", "true");
        else if (filter === "unverified") params.set("verified", "false");
        else if (filter === "reconciled") params.set("reconciled", "true");
        else if (filter === "unreconciled") params.set("reconciled", "false");
        else params.set("status", filter);
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setPayments(data.payments);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.invoice?.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.paynowReference?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [payments, searchTerm]
  );

  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const headerBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <Stack spacing={8}>
      <PageHeader
        title="Payments"
        description="View and manage PayNow transactions across all tenants."
        actions={
          <Button leftIcon={<RefreshCcw size={16} />} variant="outline" onClick={fetchPayments}>
            Refresh
          </Button>
        }
      />

      {stats && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
          <StatCard
            label="Total Revenue"
            value={`$${Number(stats.totalRevenue || 0).toFixed(2)}`}
            helperText={`${stats.unreconciledCount} unreconciled`}
            icon={DollarSign}
          />
          {stats.byStatus.map((stat) => (
            <StatCard
              key={stat.status}
              label={stat.status}
              value={stat._count}
              helperText={`$${Number(stat._sum.amount || 0).toFixed(2)}`}
              icon={CircleDot}
            />
          ))}
          <StatCard
            label="Unreconciled"
            value={stats.unreconciledCount}
            helperText="Pending verification"
            icon={ArrowPath}
          />
        </SimpleGrid>
      )}

      <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={6}>
        <Stack spacing={4}>
          <HStack justify="space-between" flexWrap="wrap" gap={3}>
            <InputGroup maxW="360px">
              <InputLeftElement pointerEvents="none">
                <Search size={16} />
              </InputLeftElement>
              <Input
                placeholder="Search by tenant, invoice, or reference"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <ButtonGroup size="sm" isAttached>
              {FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "solid" : "outline"}
                  colorScheme={filter === option.value ? "brand" : "gray"}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
          </HStack>

          {loading ? (
            <HStack justify="center" py={12}>
              <Spinner size="lg" />
            </HStack>
          ) : filteredPayments.length === 0 ? (
            <EmptyState title="No payments found" description="Adjust filters or refresh the feed." />
          ) : (
            <TableContainer>
              <Table size="md">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th>Tenant</Th>
                    <Th>Invoice</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Status</Th>
                    <Th>Reference</Th>
                    <Th>Date</Th>
                    <Th>Verified</Th>
                    <Th>Reconciled</Th>
                  </Tr>
                </Thead>
                <Tbody>
                    {filteredPayments.map((payment) => (
                    <Tr key={payment.id} _hover={{ bg: rowHoverBg }}>
                      <Td>
                        <Stack spacing={0}>
                          <Text fontWeight="medium">{payment.tenant.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {payment.tenant.email}
                          </Text>
                        </Stack>
                      </Td>
                      <Td>
                        <Stack spacing={0}>
                          <Text fontWeight="medium">{payment.invoice?.invoiceNumber ?? "N/A"}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {payment.invoice?.type ?? "N/A"}
                          </Text>
                        </Stack>
                      </Td>
                      <Td isNumeric>
                        {Number(payment.amount).toFixed(2)} {payment.currency}
                      </Td>
                      <Td>
                        <StatusBadge status={payment.status} />
                      </Td>
                      <Td>{payment.paynowReference ?? "?"}</Td>
                      <Td>
                        <Stack spacing={0} fontSize="sm">
                          <Text>{new Date(payment.createdAt).toLocaleDateString()}</Text>
                          <Text color="gray.500">{new Date(payment.createdAt).toLocaleTimeString()}</Text>
                        </Stack>
                      </Td>
                      <Td>
                        <Icon as={payment.verified ? CheckCircle2 : XCircle} color={payment.verified ? "green.500" : "red.500"} />
                      </Td>
                      <Td>
                        <Icon as={payment.reconciled ? CheckCircle2 : XCircle} color={payment.reconciled ? "green.500" : "red.500"} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorScheme =
    status === "PAID" ? "green" : status === "PENDING" ? "yellow" : status === "FAILED" ? "red" : "gray";
  return (
    <Badge colorScheme={colorScheme} variant="subtle">
      {status}
    </Badge>
  );
}

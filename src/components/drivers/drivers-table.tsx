"use client";

import {
  Avatar,
  AvatarBadge,
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { DollarSign, Eye, Pencil, Phone, User, Truck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface Driver {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
  paymentModel: string;
  debtBalance: number;
  vehicles: Array<{
    vehicle: {
      id: string;
      registrationNumber: string;
    };
  }>;
  remittances: Array<{
    id: string;
    amount: number;
    date: string;
    status: string;
  }>;
  _count: {
    remittances: number;
    contracts: number;
  };
}

interface DriversTableProps {
  drivers: Driver[];
}

export function DriversTable({ drivers }: DriversTableProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const statusColor: Record<string, string> = {
    ACTIVE: "green",
    INACTIVE: "yellow",
    TERMINATED: "red",
  };

  const paymentLabel: Record<string, string> = {
    OWNER_PAYS: "Owner Pays",
    DRIVER_REMITS: "Driver Remits",
    HYBRID: "Hybrid",
  };

  if (drivers.length === 0) {
    return (
      <EmptyState
        title="No drivers yet"
        description="Invite your first driver to start tracking remittances and assignments."
        actionLabel="Add Driver"
        onAction={() => window.location.assign("/drivers/new")}
      >
        <User size={40} />
      </EmptyState>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
      {drivers.map((driver) => {
        const primaryVehicle = driver.vehicles[0]?.vehicle;
        const lastRemittance = driver.remittances[0];
        const statusScheme = statusColor[driver.status] ?? "gray";

        return (
          <Box
            key={driver.id}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <HStack justify="space-between" align="flex-start">
              <HStack spacing={4} align="flex-start">
                <Avatar bg="brand.500" color="white" name={driver.fullName}>
                  <AvatarBadge boxSize={4} bg={`${statusScheme}.400`} />
                </Avatar>
                <Stack spacing={1}>
                  <HStack spacing={3}>
                    <Text fontWeight="semibold" fontSize="lg">
                      {driver.fullName}
                    </Text>
                    <Badge colorScheme={statusScheme}>{driver.status}</Badge>
                  </HStack>
                  <HStack spacing={3} fontSize="sm" color="gray.500">
                    <HStack spacing={1}>
                      <Phone size={16} />
                      <Text>{driver.phone}</Text>
                    </HStack>
                    {driver.email && <Text>{driver.email}</Text>}
                  </HStack>
                  <HStack spacing={4} fontSize="xs" color="gray.500">
                    <HStack spacing={1}>
                      <Truck size={14} />
                      <Text>{driver.vehicles.length} vehicles</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <DollarSign size={14} />
                      <Text>{driver._count.remittances} remittances</Text>
                    </HStack>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    Payment Model: {paymentLabel[driver.paymentModel] ?? driver.paymentModel}
                    {driver.debtBalance > 0 && (
                      <Text as="span" color="red.500" ml={2}>
                        (Debt: ${driver.debtBalance.toFixed(2)})
                      </Text>
                    )}
                  </Text>
                </Stack>
              </HStack>

              <HStack spacing={2}>
                <IconButton
                  as={NextLink}
                  href={`/drivers/${driver.id}`}
                  aria-label="View driver"
                  variant="ghost"
                  icon={<Eye size={16} />}
                />
                <IconButton
                  as={NextLink}
                  href={`/drivers/${driver.id}/edit`}
                  aria-label="Edit driver"
                  variant="ghost"
                  icon={<Pencil size={16} />}
                />
              </HStack>
            </HStack>

            <Stack mt={4} spacing={3} fontSize="sm">
              <HStack justify="space-between">
                <Text color="gray.500">Primary vehicle</Text>
                <Text fontWeight="medium">
                  {primaryVehicle ? primaryVehicle.registrationNumber : "Unassigned"}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="gray.500">Last remittance</Text>
                <Text fontWeight="medium">
                  {lastRemittance
                    ? `$${Number(lastRemittance.amount).toLocaleString()} ? ${new Date(lastRemittance.date).toLocaleDateString()}`
                    : "No remittances"}
                </Text>
              </HStack>
              <Button as={NextLink} href={`/drivers/${driver.id}`} variant="ghost" size="sm" colorScheme="brand">
                View driver profile
              </Button>
            </Stack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
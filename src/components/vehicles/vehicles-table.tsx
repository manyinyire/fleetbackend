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
import { Eye, Pencil, Truck } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  currentMileage: number;
  drivers: Array<{
    driver: {
      id: string;
      fullName: string;
    };
  }>;
  maintenanceRecords: Array<{
    id: string;
    type: string;
    date: string;
    cost: any;
  }>;
  _count: {
    remittances: number;
    expenses: number;
  };
}

interface VehiclesTableProps {
  vehicles: Vehicle[];
}

const statusColor: Record<string, string> = {
  ACTIVE: "green",
  UNDER_MAINTENANCE: "yellow",
  DECOMMISSIONED: "red",
};

export function VehiclesTable({ vehicles }: VehiclesTableProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  if (vehicles.length === 0) {
    return (
      <EmptyState
        title="No vehicles yet"
        description="Start by adding your first vehicle to unlock analytics and remittance tracking."
        actionLabel="Add Vehicle"
        onAction={() => window.location.assign("/vehicles/new")}
      >
        <Truck size={40} />
      </EmptyState>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
      {vehicles.map((vehicle) => {
        const assignedDriver = vehicle.drivers[0]?.driver;
        const lastService = vehicle.maintenanceRecords[0];
        const statusScheme = statusColor[vehicle.status] ?? "gray";

        return (
          <Box
            key={vehicle.id}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <HStack justify="space-between" align="flex-start">
              <HStack spacing={4} align="flex-start">
                <Avatar bg="brand.500" color="white" name={vehicle.registrationNumber}>
                  <AvatarBadge boxSize={4} bg={`${statusScheme}.400`} />
                </Avatar>
                <Stack spacing={1}>
                  <HStack spacing={3}>
                    <Text fontWeight="semibold" fontSize="lg">
                      {vehicle.registrationNumber}
                    </Text>
                    <Badge colorScheme={statusScheme} variant="subtle" borderRadius="full">
                      {vehicle.status.replace("_", " ")}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.500">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Text>
                  <HStack spacing={4} fontSize="xs" color="gray.500">
                    <Text>{vehicle.currentMileage.toLocaleString()} km</Text>
                    <Text>{vehicle._count.remittances} remittances</Text>
                    <Text>{vehicle._count.expenses} expenses</Text>
                  </HStack>
                </Stack>
              </HStack>

              <HStack spacing={2}>
                <IconButton
                  as={NextLink}
                  href={`/vehicles/${vehicle.id}`}
                  aria-label="View vehicle"
                  variant="ghost"
                  icon={<Eye size={16} />}
                />
                <IconButton
                  as={NextLink}
                  href={`/vehicles/${vehicle.id}/edit`}
                  aria-label="Edit vehicle"
                  variant="ghost"
                  icon={<Pencil size={16} />}
                />
              </HStack>
            </HStack>

            <Stack mt={4} spacing={3} fontSize="sm">
              <HStack justify="space-between">
                <Text color="gray.500">Primary driver</Text>
                <Text fontWeight="medium">
                  {assignedDriver ? assignedDriver.fullName : "Unassigned"}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="gray.500">Last service</Text>
                <Text fontWeight="medium">
                  {lastService ? new Date(lastService.date).toLocaleDateString() : "Not recorded"}
                </Text>
              </HStack>
              <Button as={NextLink} href={`/vehicles/${vehicle.id}`} variant="ghost" size="sm" colorScheme="brand">
                View full timeline
              </Button>
            </Stack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
"use client";

import {
  Badge,
  Box,
  Button,
  HStack,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowRight, Wrench } from "lucide-react";
import NextLink from "next/link";

type Remittance = {
  id: string;
  amount: any;
  status: string;
  date: string | Date;
  driver: { fullName: string };
  vehicle: { registrationNumber: string };
};

type Maintenance = {
  id: string;
  date: string | Date;
  type: string;
  description: string;
  cost: any;
  vehicle: { registrationNumber: string };
};

type Props = {
  remittances: Remittance[];
  maintenance: Maintenance[];
};

export function TenantRecentActivity({ remittances, maintenance }: Props) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const iconBg = useColorModeValue("brand.50", "whiteAlpha.200");

  return (
    <Stack spacing={6}>
      <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} shadow="sm" p={6}>
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="semibold">Recent Remittances</Text>
          <Button as={NextLink} href="/remittances" size="sm" rightIcon={<ArrowRight size={16} />} variant="ghost" colorScheme="brand">
            View all
          </Button>
        </HStack>
        <Stack spacing={4}>
          {remittances.length === 0 && (
            <Text fontSize="sm" color="gray.500">
              No remittances recorded yet.
            </Text>
          )}
          {remittances.slice(0, 5).map((item) => (
            <HStack key={item.id} align="flex-start" justify="space-between">
              <Stack spacing={1}>
                <Text fontWeight="semibold">${Number(item.amount).toLocaleString()}</Text>
                <Text fontSize="sm" color="gray.500">
                  {item.driver.fullName} · {item.vehicle.registrationNumber}
                </Text>
              </Stack>
              <Stack align="flex-end" spacing={1}>
                <Badge colorScheme={item.status === "APPROVED" ? "green" : item.status === "PENDING" ? "yellow" : "red"}>
                  {item.status}
                </Badge>
                <Text fontSize="xs" color="gray.400">
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </Stack>
            </HStack>
          ))}
        </Stack>
      </Box>

      <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} shadow="sm" p={6}>
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="semibold">Maintenance Timeline</Text>
          <Button as={NextLink} href="/maintenance" size="sm" rightIcon={<ArrowRight size={16} />} variant="ghost" colorScheme="brand">
            View all
          </Button>
        </HStack>
        <Stack spacing={4}>
          {maintenance.length === 0 && (
            <Text fontSize="sm" color="gray.500">
              No maintenance recorded yet.
            </Text>
          )}
          {maintenance.slice(0, 5).map((item) => (
            <HStack key={item.id} align="flex-start" justify="space-between">
              <HStack spacing={3} align="flex-start">
                <Box bg={iconBg} color="brand.600" p={2} borderRadius="lg">
                  <Wrench size={16} />
                </Box>
                <Stack spacing={1}>
                  <Text fontWeight="semibold">{item.type.replace("_", " ")}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {item.vehicle.registrationNumber} · ${Number(item.cost).toLocaleString()}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {item.description}
                  </Text>
                </Stack>
              </HStack>
              <Text fontSize="xs" color="gray.400">
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </HStack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

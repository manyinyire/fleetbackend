"use client";

import {
  Badge,
  Box,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import NextLink from "next/link";

type Vehicle = {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  drivers: Array<{ driver: { id: string; fullName: string } }>;
};

type Driver = {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  vehicles: Array<{ vehicle: { id: string; registrationNumber: string } }>;
};

type Props = {
  vehicles: Vehicle[];
  drivers: Driver[];
};

const statusColorMap: Record<string, string> = {
  ACTIVE: "green",
  UNDER_MAINTENANCE: "yellow",
  DECOMMISSIONED: "red",
  INACTIVE: "yellow",
  TERMINATED: "red",
};

export function TenantVehiclesDrivers({ vehicles, drivers }: Props) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} shadow="sm" p={6}>
      <Tabs variant="unstyled" colorScheme="brand">
        <TabList gap={4}>
          <Tab
            px={4}
            py={2}
            borderRadius="full"
            _selected={{ bg: "brand.500", color: "white" }}
            fontWeight="semibold"
          >
            Vehicles ({vehicles.length})
          </Tab>
          <Tab
            px={4}
            py={2}
            borderRadius="full"
            _selected={{ bg: "brand.500", color: "white" }}
            fontWeight="semibold"
          >
            Drivers ({drivers.length})
          </Tab>
        </TabList>

        <TabPanels mt={6}>
          <TabPanel px={0}>
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Vehicle</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Driver</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {vehicles.slice(0, 5).map((vehicle) => (
                    <Tr key={vehicle.id} _hover={{ bg: rowHoverBg }}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold" color="gray.900" _dark={{ color: "gray.100" }}>
                            {vehicle.registrationNumber}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="brand" variant="subtle">
                          {vehicle.type}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={statusColorMap[vehicle.status] ?? "gray"} variant="subtle">
                          {vehicle.status.replace("_", " ")}
                        </Badge>
                      </Td>
                      <Td>
                        {vehicle.drivers.length ? (
                          <VStack align="start" spacing={0}>
                            {vehicle.drivers.map(({ driver }) => (
                              <Text key={driver.id} fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
                                {driver.fullName}
                              </Text>
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.400">
                            Unassigned
                          </Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            <Text mt={4} fontSize="sm" color="brand.600">
              <NextLink href="/vehicles">View all vehicles →</NextLink>
            </Text>
          </TabPanel>

          <TabPanel px={0}>
            <TableContainer>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Driver</Th>
                    <Th>Phone</Th>
                    <Th>Status</Th>
                    <Th>Vehicle</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {drivers.slice(0, 5).map((driver) => (
                    <Tr key={driver.id} _hover={{ bg: rowHoverBg }}>
                      <Td fontWeight="semibold">{driver.fullName}</Td>
                      <Td>{driver.phone}</Td>
                      <Td>
                        <Badge colorScheme={statusColorMap[driver.status] ?? "gray"}>{driver.status}</Badge>
                      </Td>
                      <Td>
                        {driver.vehicles.length ? (
                          <VStack align="start" spacing={0}>
                            {driver.vehicles.map(({ vehicle }) => (
                              <Text key={vehicle.id} fontSize="sm">
                                {vehicle.registrationNumber}
                              </Text>
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.400">
                            No assignment
                          </Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            <Text mt={4} fontSize="sm" color="brand.600">
              <NextLink href="/drivers">View all drivers →</NextLink>
            </Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

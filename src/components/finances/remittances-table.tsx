"use client";

import {
  Badge,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { DollarSign } from "lucide-react";

interface Remittance {
  id: string;
  amount: number;
  date: string;
  status: string;
  driver: {
    fullName: string;
  };
  vehicle: {
    registrationNumber: string;
  };
}

interface RemittancesTableProps {
  remittances: Remittance[];
}

export function RemittancesTable({ remittances }: RemittancesTableProps) {
  const router = useRouter();
  const headerBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  if (remittances.length === 0) {
    return (
      <EmptyState
        title="No remittances"
        description="Record driver remittances to monitor income against targets."
        actionLabel="Add remittance"
        onAction={() => router.push("/remittances/new")}
      >
        <DollarSign size={40} />
      </EmptyState>
    );
  }

  return (
    <TableContainer>
      <Table size="md" variant="simple">
        <Thead bg={headerBg}>
          <Tr>
            <Th>Date</Th>
            <Th>Driver</Th>
            <Th>Vehicle</Th>
            <Th isNumeric>Amount</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {remittances.map((remittance) => {
            const statusScheme =
              remittance.status === "APPROVED" ? "green" : remittance.status === "PENDING" ? "yellow" : "red";

            return (
              <Tr
                key={remittance.id}
                _hover={{ bg: rowHoverBg, cursor: "pointer" }}
                onClick={() => router.push(`/remittances/${remittance.id}`)}
              >
                <Td>{new Date(remittance.date).toLocaleDateString()}</Td>
                <Td>{remittance.driver.fullName}</Td>
                <Td>{remittance.vehicle.registrationNumber}</Td>
                <Td isNumeric>${Number(remittance.amount).toLocaleString()}</Td>
                <Td>
                  <Badge borderRadius="full" colorScheme={statusScheme} variant="subtle">
                    {remittance.status}
                  </Badge>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

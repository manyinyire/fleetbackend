"use client";

import { Button, Grid, GridItem, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import NextLink from "next/link";
import { CalendarPlus, Car, FileText, UserPlus } from "lucide-react";

const actions = [
  {
    title: "Add Vehicle",
    description: "Register a new vehicle and assign it to your fleet.",
    href: "/vehicles/new",
    icon: Car,
  },
  {
    title: "Invite Driver",
    description: "Create a driver profile and collect compliance details.",
    href: "/drivers/new",
    icon: UserPlus,
  },
  {
    title: "Log Maintenance",
    description: "Record service and maintenance activity for a vehicle.",
    href: "/maintenance/new",
    icon: CalendarPlus,
  },
  {
    title: "Generate Report",
    description: "Export income, expenses, and remittances for stakeholders.",
    href: "/finances/reports",
    icon: FileText,
  },
];

export function TenantQuickActions() {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }} gap={4}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <GridItem key={action.href}>
            <Stack
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              spacing={3}
              p={5}
              shadow="sm"
            >
              <Button
                as={NextLink}
                href={action.href}
                leftIcon={<Icon size={18} />}
                variant="ghost"
                justifyContent="flex-start"
                fontWeight="semibold"
                colorScheme="brand"
              >
                {action.title}
              </Button>
              <Text fontSize="sm" color="gray.500">
                {action.description}
              </Text>
            </Stack>
          </GridItem>
        );
      })}
    </Grid>
  );
}

"use client";

import { Box, Flex, Heading, Icon, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  helperText?: string;
  accentColor?: string;
};

export function StatCard({ label, value, icon, helperText, accentColor = "brand.500" }: StatCardProps) {
  const iconBg = useColorModeValue("brand.50", "whiteAlpha.200");

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.100"
      _dark={{ bg: "gray.800", borderColor: "gray.700" }}
      p={6}
      shadow="sm"
    >
      <Stack spacing={3}>
        <Flex align="center" justify="space-between">
          <Text fontSize="sm" fontWeight="medium" color="gray.500">
            {label}
          </Text>
          {icon && (
            <Flex
              align="center"
              justify="center"
              boxSize={10}
              borderRadius="full"
              bg={iconBg}
              color={accentColor}
            >
              <Icon as={icon} boxSize={5} />
            </Flex>
          )}
        </Flex>
        <Heading size="lg" color="gray.900" _dark={{ color: "gray.100" }}>
          {value}
        </Heading>
        {helperText && (
          <Text fontSize="sm" color="gray.500">
            {helperText}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

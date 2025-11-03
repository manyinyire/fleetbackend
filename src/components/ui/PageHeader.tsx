"use client";

import { Heading, HStack, Stack, Text } from "@chakra-ui/react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Stack spacing={3} direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} mb={8}>
      <Stack spacing={1} maxW="3xl">
        <Heading size="lg" color="gray.900" _dark={{ color: "gray.100" }}>
          {title}
        </Heading>
        {description && (
          <Text color="gray.600" _dark={{ color: "gray.400" }}>
            {description}
          </Text>
        )}
      </Stack>
      {actions && <HStack spacing={3}>{actions}</HStack>}
    </Stack>
  );
}

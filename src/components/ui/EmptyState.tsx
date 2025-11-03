"use client";

import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
};

export function EmptyState({ title, description, actionLabel, onAction, children }: EmptyStateProps) {
  return (
    <Box
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="gray.200"
      borderRadius="2xl"
      bg="white"
      _dark={{ borderColor: "gray.700", bg: "gray.800" }}
      p={{ base: 6, md: 10 }}
      textAlign="center"
    >
      <Stack spacing={3} align="center">
        <Heading size="md" color="gray.900" _dark={{ color: "gray.100" }}>
          {title}
        </Heading>
        {description && (
          <Text color="gray.600" _dark={{ color: "gray.400" }} maxW="lg">
            {description}
          </Text>
        )}
        {children}
        {actionLabel && onAction && (
          <Button colorScheme="brand" onClick={onAction} size="md">
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

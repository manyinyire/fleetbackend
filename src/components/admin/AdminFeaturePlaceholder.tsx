"use client";

import { Box, Button, HStack, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import Link from "next/link";

type AdminFeaturePlaceholderProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AdminFeaturePlaceholder({ title, description, actionHref, actionLabel }: AdminFeaturePlaceholderProps) {
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");

  return (
    <Box bg={surface} borderRadius="2xl" borderWidth="1px" borderColor={border} p={8} textAlign="center">
      <Stack spacing={4} align="center">
        <Text fontSize="lg" fontWeight="semibold">
          {title}
        </Text>
        <Text maxW="2xl" color={useColorModeValue("gray.600", "gray.400")}> {description} </Text>
        {actionHref && actionLabel && (
          <HStack spacing={4} justify="center">
            <Button as={Link} href={actionHref} colorScheme="brand">
              {actionLabel}
            </Button>
          </HStack>
        )}
      </Stack>
    </Box>
  );
}

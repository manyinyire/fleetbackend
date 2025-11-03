"use client";

import NextLink from "next/link";
import { Divider, HStack, Link, Stack, Text } from "@chakra-ui/react";
import GoogleSigninButton from "../GoogleSigninButton";
import SignupWithPassword from "../SignupWithPassword";

export default function Signup() {
  return (
    <Stack spacing={8}>
      <GoogleSigninButton text="Sign up" />

      <HStack align="center" spacing={4}>
        <Divider flex="1" />
        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
          Or sign up with email
        </Text>
        <Divider flex="1" />
      </HStack>

      <SignupWithPassword />

      <Text textAlign="center" fontSize="sm">
        Already have an account?{" "}
        <Link as={NextLink} href="/auth/sign-in" color="brand.600" fontWeight="semibold">
          Sign In
        </Link>
      </Text>
    </Stack>
  );
}

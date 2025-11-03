"use client";

import NextLink from "next/link";
import { Divider, HStack, Link, Stack, Text } from "@chakra-ui/react";
import GoogleSigninButton from "../GoogleSigninButton";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <Stack spacing={8}>
      <GoogleSigninButton text="Sign in" />

      <HStack align="center" spacing={4}>
        <Divider flex="1" />
        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
          Or sign in with email
        </Text>
        <Divider flex="1" />
      </HStack>

      <SigninWithPassword />

      <Text textAlign="center" fontSize="sm">
        Don&apos;t have an account?{" "}
        <Link as={NextLink} href="/auth/sign-up" color="brand.600" fontWeight="semibold">
          Sign Up
        </Link>
      </Text>
    </Stack>
  );
}

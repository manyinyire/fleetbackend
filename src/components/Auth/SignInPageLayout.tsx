"use client";

import Signin from "@/components/Auth/Signin";
import NextImage from "next/image";
import NextLink from "next/link";
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Link,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

export function SignInPageLayout() {
  const panelBg = useColorModeValue("white", "gray.900");
  const panelBorder = useColorModeValue("gray.100", "gray.700");
  const accentBg = useColorModeValue(
    "linear-gradient(135deg, rgba(30,58,138,0.95), rgba(56,189,248,0.9))",
    "linear-gradient(135deg, rgba(30,58,138,0.8), rgba(56,189,248,0.6))"
  );

  return (
    <Grid minH="100vh" templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} bg={useColorModeValue("gray.50", "gray.950")}>
      <GridItem>
        <Container maxW="lg" py={{ base: 12, md: 20 }} px={{ base: 6, md: 10 }}>
          <Stack
            spacing={10}
            bg={panelBg}
            borderRadius="3xl"
            borderWidth="1px"
            borderColor={panelBorder}
            shadow="xl"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 12 }}
          >
            <Stack spacing={2}>
              <Heading size="lg">Welcome back</Heading>
              <Text color="gray.500">Sign in to manage your fleet, drivers, and remittances.</Text>
            </Stack>
            <Signin />
            <Stack spacing={2} fontSize="sm" color="gray.500">
              <Text>
                New to Azaire Fleet Manager?{" "}
                <Link as={NextLink} href="/auth/sign-up" color="brand.600" fontWeight="semibold">
                  Create an account
                </Link>
              </Text>
              <Text>
                Looking for help?{" "}
                <Link as={NextLink} href="mailto:support@azairefleet.com" color="brand.600">
                  support@azairefleet.com
                </Link>
              </Text>
            </Stack>
          </Stack>
        </Container>
      </GridItem>

      <GridItem display={{ base: "none", xl: "block" }} position="relative">
        <Box
          h="full"
          w="full"
          bg={accentBg}
          color="white"
          px={16}
          py={20}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
            <Link as={NextLink} href="/" fontWeight="bold" fontSize="lg" color="white" mb={12} display="inline-block">
              Azaire Fleet Manager
            </Link>
            <Heading size="lg" maxW="lg" mb={4}>
              Streamline fleet operations with intelligent automation.
            </Heading>
            <Text maxW="lg" color="whiteAlpha.800">
              Centralize your vehicle, driver, and finance workflows with a modern control center built for growing transport businesses in Zimbabwe.
            </Text>
          </Box>
          <Box borderRadius="3xl" overflow="hidden" borderWidth="1px" borderColor="whiteAlpha.400" shadow="2xl">
            <NextImage
              src="/images/cover/cover-02.jpg"
              alt="Fleet analytics preview"
              width={1280}
              height={900}
              priority
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
        </Box>
      </GridItem>
    </Grid>
  );
}

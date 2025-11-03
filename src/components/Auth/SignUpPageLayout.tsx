"use client";

import Signup from "@/components/Auth/Signup";
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

export function SignUpPageLayout() {
  const panelBg = useColorModeValue("white", "gray.900");
  const panelBorder = useColorModeValue("gray.100", "gray.700");
  const accentBg = useColorModeValue(
    "linear-gradient(135deg, rgba(56,189,248,0.95), rgba(30,58,138,0.95))",
    "linear-gradient(135deg, rgba(56,189,248,0.7), rgba(30,58,138,0.8))"
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
              <Heading size="lg">Create your account</Heading>
              <Text color="gray.500">Set up your workspace in minutes and bring your fleet data together.</Text>
            </Stack>
            <Signup />
            <Text fontSize="sm" color="gray.500">
              By creating an account you agree to our{" "}
              <Link as={NextLink} href="/terms" color="brand.600" fontWeight="semibold">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link as={NextLink} href="/privacy" color="brand.600" fontWeight="semibold">
                Privacy Policy
              </Link>
              .
            </Text>
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
              Launch a smarter fleet operation today.
            </Heading>
            <Text maxW="lg" color="whiteAlpha.800">
              Automate onboarding, remittances, and compliance from a single platform tailored for Zimbabwean transport teams.
            </Text>
          </Box>
          <Box borderRadius="3xl" overflow="hidden" borderWidth="1px" borderColor="whiteAlpha.400" shadow="2xl">
            <NextImage
              src="/images/cover/cover-03.jpg"
              alt="Fleet management illustration"
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

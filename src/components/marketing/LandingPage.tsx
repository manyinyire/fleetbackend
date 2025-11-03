"use client";

import NextLink from "next/link";
import Image from "next/image";
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  Icon,
  Link,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  LineChart,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

const features = [
  {
    title: "Real-time Fleet Visibility",
    description: "Track vehicle performance, location, and maintenance health in one unified dashboard.",
    icon: Activity,
  },
  {
    title: "Automated Remittances",
    description: "Streamline driver payments with smart reminders, PayNow integration, and reconciliation tools.",
    icon: Wallet,
  },
  {
    title: "Driver Compliance",
    description: "Centralize driver records, contract signatures, defensive license checks, and assignment history.",
    icon: ShieldCheck,
  },
];

const stats = [
  { label: "Vehicles Tracked", value: "2.3k+", icon: LineChart },
  { label: "Monthly Remittances", value: "$1.2M", icon: Wallet },
  { label: "Tenants Onboarded", value: "180+", icon: Users },
];

const workflow = [
  {
    title: "Onboard your fleet",
    description: "Import vehicles, driver contracts, and financial targets in minutes with smart templates.",
    icon: Users,
  },
  {
    title: "Automate your operations",
    description: "Assign drivers, schedule maintenance, and monitor remittances with proactive alerts.",
    icon: CalendarCheck2,
  },
  {
    title: "Grow with insights",
    description: "Unlock profitability dashboards, cost analysis, and predictive analytics to scale confidently.",
    icon: BarChart3,
  },
];

export function LandingPage() {
  const heroBg = useColorModeValue("linear-gradient(135deg, #ecf2ff 0%, #f8fbff 100%)", "linear-gradient(135deg, #0b1220 0%, #111827 100%)");
  const heroHeadingColor = useColorModeValue("gray.900", "gray.50");
  const heroDescriptionColor = useColorModeValue("gray.600", "gray.300");
  const heroMetaColor = useColorModeValue("gray.500", "gray.400");
  const heroFrameBorder = useColorModeValue("whiteAlpha.700", "whiteAlpha.200");

  const featureCardBg = useColorModeValue("white", "gray.800");
  const featureBorderColor = useColorModeValue("gray.100", "gray.700");
  const featureIconBg = useColorModeValue("brand.50", "whiteAlpha.200");
  const featureTextColor = useColorModeValue("gray.600", "gray.300");

  const insightsBg = useColorModeValue("gray.900", "gray.950");
  const insightsTextColor = useColorModeValue("gray.300", "gray.400");
  const insightsLinkColor = useColorModeValue("brand.200", "brand.300");

  const workflowIconBg = featureIconBg;
  const workflowTextColor = featureTextColor;

  const ctaBg = useColorModeValue(
    "linear-gradient(135deg, rgba(30,58,138,0.95), rgba(56,189,248,0.9))",
    "linear-gradient(135deg, rgba(30,58,138,0.9), rgba(56,189,248,0.7))"
  );

  return (
    <Box>
      <Box bg={heroBg} pt={{ base: 24, md: 32 }} pb={{ base: 16, md: 24 }}>
        <Container maxW="6xl">
          <Stack direction={{ base: "column", lg: "row" }} spacing={{ base: 12, lg: 16 }} align="center">
            <Stack spacing={6} flex="1">
              <Badge colorScheme="brand" w="fit-content" borderRadius="full" px={3} py={1} fontWeight="semibold">
                Fleet Management for Modern Operators
              </Badge>
              <Heading as="h1" size="2xl" lineHeight="1.1" color={heroHeadingColor}>
                Run your transport business with clarity, control, and confidence.
              </Heading>
              <Text fontSize="lg" color={heroDescriptionColor} maxW="2xl">
                Azaire Fleet Manager unifies vehicles, drivers, finances, and compliance into a single workspace so every journey is profitable and compliant.
              </Text>
              <Stack direction={{ base: "column", sm: "row" }} spacing={4} pt={2}>
                <Button as={NextLink} href="/auth/sign-up" size="lg" colorScheme="brand">
                  Start Free Trial
                </Button>
                <Button as={NextLink} href="/auth/sign-in" size="lg" variant="outline" colorScheme="brand">
                  View Demo Dashboard
                </Button>
              </Stack>
              <Text fontSize="sm" color={heroMetaColor}>
                No credit card required • Cancel anytime
              </Text>
            </Stack>

            <Box flex="1" position="relative" w="full">
              <Box
                borderRadius="3xl"
                overflow="hidden"
                shadow="2xl"
                borderWidth="1px"
                borderColor={heroFrameBorder}
              >
                <Image
                  src="/images/cover/cover-01.png"
                  alt="Azaire Fleet Manager dashboard preview"
                  width={1200}
                  height={800}
                  priority
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxW="6xl" py={{ base: 16, md: 24 }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          {features.map((feature) => (
            <Stack key={feature.title} spacing={4} p={8} bg={featureCardBg} borderRadius="2xl" borderWidth="1px" borderColor={featureBorderColor} shadow="sm">
              <Flex align="center" justify="center" boxSize={12} borderRadius="full" bg={featureIconBg} color="brand.500">
                <Icon as={feature.icon} boxSize={6} />
              </Flex>
              <Heading size="md">{feature.title}</Heading>
              <Text color={featureTextColor} fontSize="md">
                {feature.description}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>

      <Box bg={insightsBg} py={{ base: 16, md: 20 }}>
        <Container maxW="6xl">
          <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={12} alignItems="center">
            <GridItem>
              <Heading size="lg" color="white" mb={4}>
                Insights that reveal every revenue opportunity.
              </Heading>
              <Text color={insightsTextColor} fontSize="lg" mb={6}>
                Monitor income targets, expenses, and vehicle profitability with dashboards designed for accountants and fleet managers alike.
              </Text>
              <Link as={NextLink} href="/auth/sign-in" color={insightsLinkColor} fontWeight="semibold">
                Explore analytics →
              </Link>
            </GridItem>
            <GridItem>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
                {stats.map((stat) => (
                  <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accentColor="brand.200" />
                ))}
              </SimpleGrid>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      <Container maxW="6xl" py={{ base: 16, md: 24 }}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={10}>
          {workflow.map((step, index) => (
            <Stack key={step.title} spacing={4}>
              <Flex align="center" justify="center" boxSize={12} borderRadius="full" bg={workflowIconBg} color="brand.500">
                <Icon as={step.icon} boxSize={6} />
              </Flex>
              <Heading size="md">{index + 1}. {step.title}</Heading>
              <Text color={workflowTextColor}>
                {step.description}
              </Text>
            </Stack>
          ))}
        </Grid>
      </Container>

      <Container maxW="5xl" pb={{ base: 16, md: 24 }}>
        <Box
          borderRadius="3xl"
          bg={ctaBg}
          color="white"
          p={{ base: 10, md: 16 }}
          textAlign="center"
          position="relative"
          overflow="hidden"
        >
          <Stack spacing={6} align="center">
            <Heading size="lg" maxW="2xl">
              Build a fleet operation that scales with every route.
            </Heading>
            <Text fontSize="lg" maxW="2xl" color="whiteAlpha.800">
              Consolidate your fleet data, automate compliance, and empower teams with dashboards tailored for Zimbabwean transport businesses.
            </Text>
            <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
              <Button as={NextLink} href="/auth/sign-up" size="lg" colorScheme="white" color="brand.600">
                Launch Free Trial
              </Button>
              <Button as={NextLink} href="mailto:sales@azairefleet.com" size="lg" variant="outline" colorScheme="white" borderColor="whiteAlpha.700">
                Talk to Sales
              </Button>
            </Stack>
            <Divider opacity={0.3} />
            <Text fontSize="sm" color="whiteAlpha.700">
              Trusted by transport cooperatives, ride-sharing startups, and national fleets across Zimbabwe.
            </Text>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

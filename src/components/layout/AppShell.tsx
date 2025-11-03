"use client";

import { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Flex,
  Icon,
  Link,
  Text,
  VStack,
  Collapse,
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  HStack,
  Spacer,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { ChevronDown, Menu } from "lucide-react";
import type { NavSection, NavItem } from "@/config/navigation";

type AppShellProps = {
  sections: NavSection[];
  children: React.ReactNode;
  headerContent?: React.ReactNode;
};

const navItemIsActive = (item: NavItem, pathname: string) => {
  if (pathname === item.href) return true;
  return item.children?.some((child) => pathname.startsWith(child.href));
};

const SidebarContent = ({ sections, pathname, onNavigate }: { sections: NavSection[]; pathname: string; onNavigate?: () => void }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <VStack align="stretch" spacing={6} px={4} py={6} w="full">
      {sections.map((section) => (
        <Box key={section.title}>
          <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="gray.500" mb={2} px={3}>
            {section.title}
          </Text>
          <VStack align="stretch" spacing={1}>
            {section.items.map((item) => {
              const hasChildren = !!item.children?.length;
              const isActive = navItemIsActive(item, pathname);
              const isExpanded = expanded[item.href] ?? isActive;

              const handleToggle = () => {
                if (hasChildren) {
                  setExpanded((prev) => ({ ...prev, [item.href]: !isExpanded }));
                } else if (onNavigate) {
                  onNavigate();
                }
              };

              return (
                <Box key={item.href} borderRadius="lg" overflow="hidden">
                  <Link
                    as={NextLink}
                    href={item.href}
                    onClick={handleToggle}
                    display="flex"
                    alignItems="center"
                    px={3}
                    py={2}
                    gap={3}
                    fontWeight={isActive ? "semibold" : "medium"}
                    color={isActive ? "brand.600" : "gray.600"}
                    _hover={{ textDecoration: "none", bg: "gray.100" }}
                    rounded="lg"
                    bg={isActive ? "brand.50" : "transparent"}
                  >
                    <Icon as={item.icon} boxSize={4} />
                    <Text flex="1">{item.label}</Text>
                    {hasChildren && (
                      <Icon
                        as={ChevronDown}
                        boxSize={4}
                        transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"}
                        transition="transform 0.2s"
                      />
                    )}
                  </Link>
                  {hasChildren && (
                    <Collapse in={isExpanded} animateOpacity>
                      <VStack align="stretch" spacing={1} pl={9} py={2} bg="gray.50">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            as={NextLink}
                            href={child.href}
                            color={pathname.startsWith(child.href) ? "brand.600" : "gray.600"}
                            fontWeight={pathname.startsWith(child.href) ? "semibold" : "medium"}
                            _hover={{ textDecoration: "none", color: "brand.600" }}
                            onClick={onNavigate}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </VStack>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
};

export function AppShell({ sections, children, headerContent }: AppShellProps) {
  const pathname = usePathname();
  const mobileNav = useDisclosure();

  return (
    <Flex minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Box display={{ base: "none", md: "block" }} w={{ md: 72 }} borderRightWidth="1px" borderColor="gray.200" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
        <Box px={6} py={6} borderBottomWidth="1px" borderColor="gray.100" _dark={{ borderColor: "gray.700" }}>
          <Text fontSize="lg" fontWeight="bold" color="brand.600">
            Azaire Fleet
          </Text>
          <Text fontSize="xs" color="gray.500">
            Fleet Operations Suite
          </Text>
        </Box>
        <SidebarContent sections={sections} pathname={pathname} />
      </Box>

      <Drawer placement="left" isOpen={mobileNav.isOpen} onClose={mobileNav.onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent pt={4} bg="white" _dark={{ bg: "gray.900" }}>
          <SidebarContent sections={sections} pathname={pathname} onNavigate={mobileNav.onClose} />
        </DrawerContent>
      </Drawer>

      <Flex direction="column" flex="1" minH="full">
        <Box
          as="header"
          px={{ base: 4, md: 8 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="gray.100"
          bg="white"
          _dark={{ bg: "gray.900", borderColor: "gray.700" }}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack spacing={4} align="center">
            <IconButton
              display={{ base: "inline-flex", md: "none" }}
              variant="ghost"
              aria-label="Open navigation"
              icon={<Menu />}
              onClick={mobileNav.onOpen}
            />
            <Box display={{ base: "none", md: "block" }}>
              <Text fontWeight="semibold" color="gray.600" textTransform="uppercase" fontSize="xs">
                Control Center
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="gray.900">
                {headerContent ? null : "Overview"}
              </Text>
            </Box>
            {headerContent}
            <Spacer />
          </HStack>
        </Box>

        <Box as="main" flex="1" px={{ base: 4, md: 8 }} py={8}>
          {children}
        </Box>

        <Box as="footer" px={{ base: 4, md: 8 }} py={6} borderTopWidth="1px" borderColor="gray.100" bg="white" _dark={{ bg: "gray.900", borderColor: "gray.700" }}>
          <Divider mb={4} />
          <Text fontSize="sm" color="gray.500">
            © {new Date().getFullYear()} Azaire Fleet Manager. All rights reserved.
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}

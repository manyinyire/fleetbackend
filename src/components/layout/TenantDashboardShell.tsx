"use client";

import { AppShell } from "@/components/layout/AppShell";
import { tenantNav } from "@/config/navigation";
import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { Bell, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useRouter } from "next/navigation";

type TenantDashboardShellProps = {
  user: any;
  children: React.ReactNode;
};

function HeaderActions({ user }: { user: any }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const router = useRouter();
  const inputBg = useColorModeValue("white", "gray.800");
  const inputBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <HStack spacing={4} flex="1" justify="flex-end">
      <InputGroup maxW={{ base: "0", lg: "280px" }} display={{ base: "none", lg: "flex" }}>
        <InputLeftElement pointerEvents="none">
          <Search size={18} color="gray" />
        </InputLeftElement>
        <Input placeholder="Search vehicles, drivers..." bg={inputBg} borderColor={inputBorder} />
      </InputGroup>

      <IconButton
        aria-label="Toggle theme"
        variant="ghost"
        onClick={toggleColorMode}
        icon={colorMode === "light" ? <Moon size={18} /> : <Sun size={18} />}
      />

      <IconButton aria-label="Notifications" variant="ghost" icon={<Bell size={18} />} />

      <Menu>
        <MenuButton>
          <Avatar size="sm" name={user?.name ?? "User"} src={user?.image ?? undefined}>
            <AvatarBadge boxSize={3} bg="brand.500" />
          </Avatar>
        </MenuButton>
        <MenuList>
          <Box px={3} py={2}>
            <Text fontWeight="semibold">{user?.name}</Text>
            <Text fontSize="sm" color="gray.500">
              {user?.email}
            </Text>
          </Box>
          <MenuDivider />
          <MenuItem icon={<User size={16} />} onClick={() => router.push("/profile")}>
            Profile
          </MenuItem>
          <MenuItem icon={<Settings size={16} />} onClick={() => router.push("/settings")}>
            Settings
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<LogOut size={16} />} onClick={() => router.push("/auth/sign-out")}
            color="red.500"
          >
            Sign out
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
}

export function TenantDashboardShell({ user, children }: TenantDashboardShellProps) {
  const router = useRouter();
  const quickActions = (
    <HStack spacing={4} flex="1" justify="flex-end">
      <Button
        colorScheme="brand"
        variant="solid"
        onClick={() => router.push("/vehicles/new")}
        display={{ base: "none", md: "inline-flex" }}
      >
        Add Vehicle
      </Button>
      <HeaderActions user={user} />
    </HStack>
  );

  return (
    <AppShell sections={tenantNav} headerContent={quickActions}>
      <Stack spacing={8}>{children}</Stack>
    </AppShell>
  );
}

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { superAdminNav } from "@/config/navigation";
import {
  Avatar,
  AvatarBadge,
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
  Spacer,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Bell, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";

type AdminDashboardShellProps = {
  user: any;
  children: React.ReactNode;
};

function HeaderActions({ user }: { user: any }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const router = useRouter();
  const searchBg = useColorModeValue("white", "gray.800");
  const searchBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <HStack spacing={4} align="center">
      <InputGroup display={{ base: "none", md: "flex" }} maxW="280px">
        <InputLeftElement pointerEvents="none">
          <Search size={16} />
        </InputLeftElement>
        <Input placeholder="Search admin tools..." bg={searchBg} borderColor={searchBorder} />
      </InputGroup>

      <IconButton
        aria-label="Toggle theme"
        variant="ghost"
        icon={colorMode === "light" ? <Moon size={16} /> : <Sun size={16} />}
        onClick={toggleColorMode}
      />

      <IconButton aria-label="Notifications" variant="ghost" icon={<Bell size={16} />} />

      <Menu>
        <MenuButton>
          <Avatar size="sm" name={user?.name ?? "Admin"}>
            <AvatarBadge boxSize={3} bg="green.400" />
          </Avatar>
        </MenuButton>
        <MenuList>
          <Stack spacing={0} px={3} py={2}>
            <Text fontWeight="semibold">{user?.name ?? "Super Admin"}</Text>
            <Text fontSize="sm" color="gray.500">
              {user?.email ?? "admin@example.com"}
            </Text>
          </Stack>
          <MenuDivider />
          <MenuItem icon={<User size={16} />} onClick={() => router.push("/profile")}>
            Profile
          </MenuItem>
          <MenuItem icon={<Settings size={16} />} onClick={() => router.push("/admin/settings")}>
            Settings
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<LogOut size={16} />} onClick={() => router.push("/auth/sign-out")} color="red.500">
            Sign out
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
}

export function AdminDashboardShell({ user, children }: AdminDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const headerActions = useMemo(
    () => (
      <HStack spacing={4} w="full">
        <Text fontSize="sm" color="gray.500">
          {pathname}
        </Text>
        <Spacer />
        <Button
          leftIcon={<SparkleIcon />}
          size="sm"
          variant="ghost"
          colorScheme="brand"
          onClick={() => router.push("/admin/report-builder")}
        >
          Create Report
        </Button>
        <HeaderActions user={user} />
      </HStack>
    ),
    [pathname, router, user]
  );

  return (
    <AppShell sections={superAdminNav} headerContent={headerActions}>
      <Stack spacing={8}>{children}</Stack>
    </AppShell>
  );
}

function SparkleIcon() {
  return (
    <Icon viewBox="0 0 24 24" boxSize={4} color="brand.500">
      <path
        fill="currentColor"
        d="M12 3a1 1 0 0 1 .894.553l1.382 2.764 3.05.443a1 1 0 0 1 .554 1.706l-2.206 2.151.521 3.034a1 1 0 0 1-1.451 1.054L12 13.889l-2.745 1.444a1 1 0 0 1-1.45-1.054l.52-3.034-2.205-2.15a1 1 0 0 1 .552-1.707l3.05-.442L11.106 3.553A1 1 0 0 1 12 3Zm7 9a1 1 0 0 1 .964.737l.45 1.802 1.801.45a1 1 0 0 1 .515 1.644l-1.237 1.412.178 1.86a1 1 0 0 1-1.477.946L18 19.68l-1.193.711a1 1 0 0 1-1.477-.946l.178-1.86-1.237-1.413a1 1 0 0 1 .515-1.643l1.801-.45.45-1.802A1 1 0 0 1 19 12Z"
      />
    </Icon>
  );
}

"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LogOutIcon, SettingsIcon, UserIcon, ShieldCheckIcon } from "./icons";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/sign-in');
  };

  // Show loading state while session is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="size-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  // If no user after loading, show placeholder or return null
  if (!user) {
    console.warn('SuperAdmin UserInfo: No user data available after loading');
    return (
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400 text-xs">?</span>
        </div>
      </div>
    );
  }

  // Get user data from authenticated session
  const userName = user?.name || (user?.email ? user.email.split('@')[0] : "Admin");
  
  const USER = {
    name: userName,
    email: user?.email || "admin@azaire.com",
    img: user?.image || "/images/user/user-03.png",
    role: "Platform Owner",
    initials: getInitials(userName || "Admin"),
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">Super Admin Account</span>

        <figure className="flex items-center gap-3">
          <div className="relative">
            {user?.image ? (
              <Image
                src={user.image}
                className="size-12 rounded-full object-cover"
                alt={`Avatar of ${USER.name}`}
                role="presentation"
                width={200}
                height={200}
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-semibold text-white">
                {USER.initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              <ShieldCheckIcon className="h-3 w-3" />
            </div>
          </div>
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{USER.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">Super Admin information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <div className="relative">
            {user?.image ? (
              <Image
                src={user.image}
                className="size-12 rounded-full object-cover"
                alt={`Avatar for ${USER.name}`}
                role="presentation"
                width={200}
                height={200}
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-semibold text-white">
                {USER.initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              <ShieldCheckIcon className="h-3 w-3" />
            </div>
          </div>

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {USER.name}
            </div>
            <div className="leading-none text-gray-6">{USER.email}</div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {USER.role}
            </div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/superadmin/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          <Link
            href={"/superadmin/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Admin Settings
            </span>
          </Link>

          <Link
            href={"/superadmin/security"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <ShieldCheckIcon />

            <span className="mr-auto text-base font-medium">
              Security Settings
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={handleLogout}
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
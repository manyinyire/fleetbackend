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
import { useState, useEffect } from "react";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SparklesIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

interface PlanInfo {
  id: string;
  name: string;
  monthly: number;
}

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanInfo | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    if ((user as any)?.tenantId) {
      fetchPlan();
    } else {
      setLoadingPlan(false);
    }
  }, [(user as any)?.tenantId]);

  const fetchPlan = async () => {
    try {
      const response = await fetch('/api/tenant/plan');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentPlan(data.currentPlan);
        }
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
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
    const isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isDevelopment) {
      console.warn('UserInfo: No user data available after loading', { isLoading });
    }
    return (
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400 text-xs">?</span>
        </div>
      </div>
    );
  }

  // BetterAuth should include name in session, but fallback to email prefix if missing
  const userName = user?.name || (user?.email ? user.email.split('@')[0] : "User");
  
  const USER = {
    name: userName,
    email: user?.email || "",
    img: user?.image || null,
    initials: getInitials(userName),
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          {USER.img ? (
            <Image
              src={USER.img}
              className="size-12 rounded-full"
              alt={`Avatar of ${USER.name}`}
              role="presentation"
              width={48}
              height={48}
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
              {USER.initials}
            </div>
          )}
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
        <h2 className="sr-only">User information</h2>

                <figure className="flex items-center gap-2.5 px-5 py-3.5">
          {USER.img ? (
            <Image
              src={USER.img}
              className="size-12 rounded-full"
              alt={`Avatar for ${USER.name}`}
              role="presentation"
              width={48}
              height={48}
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
              {USER.initials}
            </div>
          )}

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">       
              {USER.name}
            </div>

            <div className="leading-none text-gray-6">{USER.email}</div>        
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          {/* Current Package */}
          {!loadingPlan && currentPlan && (
            <div className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white">
              <SparklesIcon className="h-5 w-5 text-primary" />
              <div className="mr-auto flex flex-col">
                <span className="text-base font-medium">Current Plan</span>
                <span className="text-xs text-dark-5 dark:text-dark-6">
                  {currentPlan.name} {currentPlan.monthly > 0 ? `($${currentPlan.monthly}/mo)` : '(Free)'}
                </span>
              </div>
            </div>
          )}

          {/* Upgrade Option */}
          {!loadingPlan && currentPlan && currentPlan.id !== 'PREMIUM' && (
            <Link
              href={"/upgrade"}
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            >
              <ArrowUpIcon className="h-5 w-5 text-green-600" />

              <span className="mr-auto text-base font-medium">
                Upgrade Plan
              </span>
            </Link>
          )}

          <Link
            href={"/account-settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
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

"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BellIcon } from "./icons";

interface TenantSignup {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  createdAt: string;
}

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(true);
  const isMobile = useIsMobile();
  const [signups, setSignups] = useState<TenantSignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSignups();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchRecentSignups, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentSignups = async () => {
    try {
      const response = await fetch('/api/superadmin/dashboard/activity?limit=5');
      const result = await response.json();
      
      if (result.success && result.data?.recentSignups) {
        setSignups(result.data.recentSignups);
        setIsDotVisible(result.data.recentSignups.length > 0);
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "critical":
        return "🔴";
      case "warning":
        return "🟡";
      case "success":
        return "🟢";
      case "info":
        return "🔵";
      default:
        return "⚪";
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);

        if (setIsDotVisible) setIsDotVisible(false);
      }}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View System Notifications"
      >
        <span className="relative">
          <BellIcon />

          {isDotVisible && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[20rem]"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            New Tenant Sign-ups
          </span>
          {signups.length > 0 && (
            <span className="rounded-md bg-green-600 px-[9px] py-0.5 text-xs font-medium text-white">
              {signups.length} new
            </span>
          )}
        </div>

        <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
          {loading ? (
            <li className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </li>
          ) : signups.length > 0 ? (
            signups.map((signup) => (
              <li key={signup.id} role="menuitem">
                <Link
                  href={`/superadmin/tenants/${signup.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <span className="text-2xl">{getNotificationIcon("success")}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <strong className="block text-sm font-medium text-dark dark:text-white truncate">
                      {signup.name}
                    </strong>

                    <span className="block text-sm font-medium text-dark-5 dark:text-dark-6 truncate">
                      Registered for {signup.plan} plan
                    </span>
                    
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(signup.createdAt).toLocaleString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              No new sign-ups
            </li>
          )}
        </ul>

        <Link
          href="/superadmin/notifications"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          View all alerts
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
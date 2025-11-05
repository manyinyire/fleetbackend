"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BellIcon } from "./icons";
import { 
  CurrencyDollarIcon, 
  IdentificationIcon,
  ExclamationCircleIcon 
} from "@heroicons/react/24/outline";

interface Notification {
  id: string;
  type: 'remittance_due' | 'license_expiring';
  title: string;
  message: string;
  link: string;
  severity: 'warning' | 'critical';
  date: string;
}

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');

      // Check if response is ok and is JSON
      if (!response.ok) {
        // If not authenticated or other error, just skip silently
        console.warn('Notifications API returned status:', response.status);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Not JSON response, likely an error page or redirect
        console.warn('Notifications API did not return JSON');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setIsDotVisible((data.notifications || []).length > 0);
      }
    } catch (error) {
      // Silently fail for notifications - they're not critical
      console.warn('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'remittance_due') {
      return <CurrencyDollarIcon className="h-5 w-5 text-white" />;
    } else if (type === 'license_expiring') {
      return <IdentificationIcon className="h-5 w-5 text-white" />;
    }
    return <BellIcon />;
  };

  const getNotificationColor = (severity: string) => {
    return severity === 'critical' 
      ? 'bg-red-500' 
      : 'bg-amber-500';
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
        aria-label="View Notifications"
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
            Notifications
          </span>
          {notifications.length > 0 && (
            <span className="rounded-md bg-primary px-[9px] py-0.5 text-xs font-medium text-white">
              {notifications.length} {notifications.length === 1 ? 'new' : 'new'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-dark-5 dark:text-dark-6">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <BellIcon className="mx-auto h-8 w-8 text-dark-5 dark:text-dark-6" />
            <p className="mt-2 text-sm text-dark-5 dark:text-dark-6">No notifications</p>
          </div>
        ) : (
          <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
            {notifications.map((notification) => (
              <li key={notification.id} role="menuitem">
                <Link
                  href={notification.link}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
                >
                  <div className={`flex-shrink-0 p-2 rounded-md ${getNotificationColor(notification.severity)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <strong className="block text-sm font-medium text-dark dark:text-white">
                      {notification.title}
                    </strong>

                    <span className="block text-xs text-dark-5 dark:text-dark-6 mt-0.5">
                      {notification.message}
                    </span>
                    
                    <span className="block text-xs text-dark-5 dark:text-dark-6 mt-1">
                      {new Date(notification.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {notification.severity === 'critical' && (
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {notifications.length > 0 && (
          <Link
            href="/remittances"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
          >
            View all remittances
          </Link>
        )}
      </DropdownContent>
    </Dropdown>
  );
}

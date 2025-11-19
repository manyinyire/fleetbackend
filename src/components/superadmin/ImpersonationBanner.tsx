"use client";

import { useState, useEffect } from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";
import { authClient } from "@/lib/auth-client";

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Check for impersonation status
    // Note: Impersonation is not yet implemented with Auth.js v5
    // This component will remain hidden until the feature is implemented
    const checkImpersonation = async () => {
      try {
        // TODO: Implement impersonation check when Auth.js v5 impersonation is ready
        // For now, always return false
        setIsImpersonating(false);
      } catch (err) {
        console.error("Failed to check impersonation:", err);
        setIsImpersonating(false);
      }
    };

    checkImpersonation();
  }, []);

  const handleStopImpersonation = async () => {
    try {
      await superAdminAPI.stopImpersonation();
      setIsImpersonating(false);
      window.location.href = "/superadmin/dashboard";
    } catch (err) {
      console.error("Failed to stop impersonation:", err);
      alert("Failed to stop impersonation");
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ IMPERSONATING: {userName}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              You are viewing the system as this user. All actions will be logged.
            </p>
          </div>
        </div>
        <button
          onClick={handleStopImpersonation}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>Stop Impersonating</span>
        </button>
      </div>
    </div>
  );
}


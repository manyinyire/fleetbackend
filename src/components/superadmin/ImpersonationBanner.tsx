"use client";

import { useState, useEffect } from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";
import { authClient } from "@/lib/auth-client";

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Check for impersonation via BetterAuth session
    const checkImpersonation = async () => {
      try {
        const session = await authClient.getSession();
        // BetterAuth stores impersonation info in session
        // Check if session has impersonatedBy field or if user role changed unexpectedly
        if (session?.data?.session) {
          // BetterAuth admin plugin sets impersonatedBy in session
          // We can check this via an API call or session data
          try {
            const response = await fetch('/api/auth/session');
            
            // Check if response is ok and has content
            if (!response.ok) {
              return; // Exit early if response is not ok
            }
            
            // Check if response has content before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              return; // Exit if not JSON
            }
            
            // Get text first to check if it's empty
            const text = await response.text();
            if (!text || text.trim().length === 0) {
              return; // Exit if empty response
            }
            
            // Parse JSON only if we have content
            let sessionData;
            try {
              sessionData = JSON.parse(text);
            } catch (parseError) {
              console.warn("Failed to parse session response:", parseError);
              return; // Exit if JSON parsing fails
            }
            
            // Check if session indicates impersonation (BetterAuth handles this internally)
            // For now, check if user is not SUPER_ADMIN but we're in superadmin portal
            if (sessionData?.user && sessionData.user.role !== 'SUPER_ADMIN') {
              setIsImpersonating(true);
              setUserName(sessionData.user.name || sessionData.user.email);
            } else {
              setIsImpersonating(false);
            }
          } catch (fetchError) {
            // Silently handle fetch errors - session endpoint might not exist
            // This is expected if BetterAuth doesn't expose /api/auth/session
            setIsImpersonating(false);
          }
        } else {
          setIsImpersonating(false);
        }
      } catch (err) {
        console.error("Failed to check impersonation:", err);
        setIsImpersonating(false);
      }
    };

    checkImpersonation();
    // Check periodically
    const interval = setInterval(checkImpersonation, 2000);
    return () => clearInterval(interval);
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


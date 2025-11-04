"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { 
  LinkIcon, 
  TrashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";

interface Account {
  id: string;
  providerId: string;
  providerAccountId: string;
  userId: string;
  createdAt: string;
}

export function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const result = await authClient.listAccounts();
      setAccounts(result || []);
    } catch (error: any) {
      console.error("Failed to load accounts:", error);
      toast.error("Failed to load linked accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/profile",
      });
      // User will be redirected to Google OAuth
    } catch (error: any) {
      toast.error(error.message || "Failed to start account linking");
    }
  };

  const handleUnlink = async (providerId: string, accountId?: string) => {
    if (accounts.length === 1) {
      toast.error("Cannot unlink your only account. Please add another account first.");
      return;
    }

    if (!confirm(`Are you sure you want to unlink your ${providerId} account?`)) {
      return;
    }

    setUnlinking(providerId);

    try {
      await authClient.unlinkAccount({
        providerId,
        accountId,
      });

      toast.success("Account unlinked successfully");
      loadAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to unlink account");
    } finally {
      setUnlinking(null);
    }
  };

  const getProviderName = (providerId: string) => {
    const names: Record<string, string> = {
      google: "Google",
      github: "GitHub",
      email: "Email & Password",
    };
    return names[providerId] || providerId;
  };

  const getProviderIcon = (providerId: string) => {
    if (providerId === "email") {
      return <EnvelopeIcon className="h-5 w-5" />;
    }
    return <LinkIcon className="h-5 w-5" />;
  };

  const hasGoogle = accounts.some((acc) => acc.providerId === "google");
  const hasEmail = accounts.some((acc) => acc.providerId === "email");

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <div className="border-b border-stroke pb-4 dark:border-dark-3">
        <h3 className="text-lg font-bold text-dark dark:text-white">
          Linked Accounts
        </h3>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Manage accounts linked to your profile
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            {accounts.length === 0 ? (
              <p className="text-sm text-dark-5 dark:text-dark-6 text-center py-4">
                No linked accounts found
              </p>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-stroke p-4 dark:border-dark-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {getProviderIcon(account.providerId)}
                    </div>
                    <div>
                      <p className="font-medium text-dark dark:text-white">
                        {getProviderName(account.providerId)}
                      </p>
                      <p className="text-sm text-dark-5 dark:text-dark-6">
                        Linked {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlink(account.providerId, account.id)}
                    disabled={unlinking === account.providerId || accounts.length === 1}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unlinking === account.providerId ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                        Unlinking...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4" />
                        Unlink
                      </>
                    )}
                  </button>
                </div>
              ))
            )}

            {/* Link New Account */}
            <div className="border-t border-stroke pt-4 dark:border-dark-3">
              <p className="mb-3 text-sm font-medium text-dark dark:text-white">
                Link New Account
              </p>
              <div className="flex flex-wrap gap-2">
                {!hasGoogle && (
                  <button
                    onClick={handleLinkGoogle}
                    className="flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Link Google
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


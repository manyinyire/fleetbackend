"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export function DeleteAccountSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement account deletion when BetterAuth supports it
      toast.error("Account deletion feature not yet implemented");
      setShowConfirm(false);
      setConfirmText("");
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate account deletion");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  // Prevent SUPER_ADMIN from deleting their account
  if ((session.user as any).role === "SUPER_ADMIN") {
    return (
      <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
        <div className="flex items-start gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Account Deletion Not Available
            </p>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Super admin accounts cannot be deleted for security reasons.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark border-2 border-red-200 dark:border-red-800">
      <div className="border-b border-stroke pb-4 dark:border-dark-3">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
          Delete Account
        </h3>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Permanently delete your account and all associated data
        </p>
      </div>

      {!showConfirm ? (
        <div className="mt-6">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Warning: This action cannot be undone
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Deleting your account will permanently remove all your data, including:
                </p>
                <ul className="mt-2 ml-4 list-disc text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>Your profile information</li>
                  <li>All your sessions and active logins</li>
                  <li>Associated tenant data (if applicable)</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            Delete My Account
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              To confirm account deletion:
            </p>
            <ol className="ml-4 list-decimal text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>Type <strong>DELETE</strong> in the field below</li>
              <li>Click &quot;Confirm Deletion&quot;</li>
              <li>Check your email for the verification link</li>
              <li>Click the link in the email to complete deletion</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray px-5.5 py-3 text-dark outline-none focus:border-red-500 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
                disabled={loading}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || confirmText !== "DELETE"}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    Confirm Deletion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


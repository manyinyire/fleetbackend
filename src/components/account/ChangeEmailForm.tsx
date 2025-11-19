"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { EnvelopeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function ChangeEmailForm() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (newEmail === session?.user?.email) {
      toast.error("New email must be different from current email");
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement email change when BetterAuth supports it
      toast.error("Email change feature not yet implemented");
      setNewEmail("");
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <div className="flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
        <div>
          <h3 className="text-lg font-bold text-dark dark:text-white">
            Email Address
          </h3>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            {session.user.email}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
          >
            Change Email
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-6">
          <div className="mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Email Change Verification Required
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  A verification email will be sent to your current email address. You must approve the change before it takes effect.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                New Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="new-email@example.com"
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-gray pl-10 pr-5.5 py-3 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-dark-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewEmail("");
                }}
                disabled={loading}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Verification Email"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


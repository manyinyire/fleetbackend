"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface EmailVerificationPendingProps {
  email: string;
}

export function EmailVerificationPending({ email }: EmailVerificationPendingProps) {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to resend verification email");
      } else {
        toast.success("Verification email sent! Please check your inbox.");
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error("Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          Verification Email Sent
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          We&apos;ve sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to verify your account.
        </p>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 mb-4">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The link will expire in 24 hours</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Check your spam folder if you don&apos;t see the email</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>You can request a new link if the current one expires</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Didn&apos;t receive the email?
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? (
            <>
              <span className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent" />
              Sending...
            </>
          ) : (
            "Resend Verification Email"
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <a
          href="/auth/sign-in"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
        >
          Back to Sign In
        </a>
      </div>
    </div>
  );
}

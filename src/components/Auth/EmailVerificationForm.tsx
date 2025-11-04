"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface EmailVerificationFormProps {
  email: string;
}

export function EmailVerificationForm({ email }: EmailVerificationFormProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code");
        setLoading(false);
        return;
      }

      toast.success("Email verified successfully!");
      
      // Redirect to onboarding after verification
      router.push("/onboarding");
      router.refresh();
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Failed to verify email");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to resend verification code");
      } else {
        toast.success("Verification code sent to your email");
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error("Failed to resend verification code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mt-8">
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            placeholder="000000"
            disabled={loading}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Check your email for the 6-digit code
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          ) : (
            "Verify Email"
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-primary hover:text-opacity-80 disabled:opacity-50"
        >
          {resending ? "Sending..." : "Resend verification code"}
        </button>
      </div>
    </div>
  );
}


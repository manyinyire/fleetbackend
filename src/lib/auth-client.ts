import { signOut as nextAuthSignOut } from "next-auth/react";
import { apiLogger } from '@/lib/logger';

// Re-export NextAuth functions for backward compatibility
export { useSession, signIn } from "next-auth/react";

// Custom signOut wrapper
export const signOut = async () => {
  // Clear session and redirect to sign-in
  await nextAuthSignOut({ 
    callbackUrl: "/auth/sign-in",
    redirect: true
  });
};

// Stub authClient for features that need to be re-implemented
// TODO: Implement these features with Auth.js v5
export const authClient = {
  admin: {
    impersonate: async () => {
      apiLogger.warn('Impersonation not yet implemented with Auth.js v5');
      return { error: { message: "Feature not yet implemented" } };
    },
    stopImpersonating: async () => {
      apiLogger.warn('Stop impersonation not yet implemented with Auth.js v5');
      return { error: { message: "Feature not yet implemented" } };
    },
  },
  emailOtp: {
    sendVerificationOtp: async (data: { email: string; type?: string }) => {
      try {
        const response = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: data.email }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: { message: result.error || "Failed to send verification email" } };
        }

        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message || "Failed to send verification email" } };
      }
    },
    verifyEmail: async (data: { email: string; otp: string }) => {
      // Note: Current implementation uses token-based verification (link in email)
      // not OTP-based verification. This is a stub for compatibility.
      apiLogger.warn('OTP-based email verification not implemented. Use token-based verification via email link.');
      return { error: { message: "OTP verification not supported. Please use the link sent to your email." } };
    },
  },
  twoFactor: {
    enable: async () => {
      apiLogger.warn('2FA not yet implemented with Auth.js v5');
      return { error: { message: "Feature not yet implemented" } };
    },
    disable: async () => {
      apiLogger.warn('2FA disable not yet implemented with Auth.js v5');
      return { error: { message: "Feature not yet implemented" } };
    },
  },
  user: {
    update: async (data: { name?: string; image?: string }) => {
      try {
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: { message: result.error || "Failed to update profile" } };
        }

        return { data: result.data };
      } catch (error: any) {
        return { error: { message: error.message || "Failed to update profile" } };
      }
    },
    changeEmail: async () => {
      apiLogger.warn('Change email not yet implemented with Auth.js v5');
      return { error: { message: "Feature not yet implemented" } };
    },
    deleteAccount: async () => {
      apiLogger.warn('Delete account not yet implemented with Auth.js v5');
      return { error: { message: "Feature not yet implemented" } };
    },
  },
};

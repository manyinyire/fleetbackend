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
    impersonate: async (userId: string) => {
      try {
        const response = await fetch("/api/superadmin/impersonation/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: { message: result.error || "Failed to start impersonation" } };
        }

        // Reload page to apply new session
        if (result.success) {
          window.location.reload();
        }

        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message || "Failed to start impersonation" } };
      }
    },
    stopImpersonating: async () => {
      try {
        const response = await fetch("/api/superadmin/impersonation/stop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: { message: result.error || "Failed to stop impersonation" } };
        }

        // Reload page to restore original session
        if (result.success) {
          window.location.reload();
        }

        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message || "Failed to stop impersonation" } };
      }
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
      try {
        const response = await fetch("/api/auth/2fa/enable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: { message: result.error || "Failed to enable 2FA" } };
        }

        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message || "Failed to enable 2FA" } };
      }
    },
    verify: async (token: string) => {
      try {
        const response = await fetch("/api/auth/2fa/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: { message: result.error || "Failed to verify 2FA" } };
        }

        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message || "Failed to verify 2FA" } };
      }
    },
    disable: async (password: string, token?: string) => {
      try {
        const response = await fetch("/api/auth/2fa/disable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password, token }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: { message: result.error || "Failed to disable 2FA" } };
        }

        return { data: result };
      } catch (error: any) {
        return { error: { message: error.message || "Failed to disable 2FA" } };
      }
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

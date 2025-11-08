import { signOut as nextAuthSignOut } from "next-auth/react";

// Re-export NextAuth functions for backward compatibility
export { useSession, signIn } from "next-auth/react";

// Custom signOut wrapper
export const signOut = async () => {
  await nextAuthSignOut({ callbackUrl: "/auth/sign-in" });
};

// Stub authClient for features that need to be re-implemented
// TODO: Implement these features with Auth.js v5
export const authClient = {
  admin: {
    impersonate: async () => {
      console.warn("Impersonation not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
    stopImpersonating: async () => {
      console.warn("Stop impersonation not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
  },
  emailOtp: {
    sendVerificationOtp: async () => {
      console.warn("Email OTP not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
  },
  twoFactor: {
    enable: async () => {
      console.warn("2FA not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
    disable: async () => {
      console.warn("2FA disable not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
  },
  user: {
    update: async () => {
      console.warn("User update not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
    changeEmail: async () => {
      console.warn("Change email not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
    deleteAccount: async () => {
      console.warn("Delete account not yet implemented with Auth.js v5");
      return { error: { message: "Feature not yet implemented" } };
    },
  },
};

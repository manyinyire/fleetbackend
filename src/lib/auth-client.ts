import { createAuthClient } from "better-auth/react";
import { emailOTPClient, adminClient } from "better-auth/client/plugins";
import { appConfig } from '@/config/app';

export const authClient = createAuthClient({
  baseURL: appConfig.baseUrl,
  plugins: [
    emailOTPClient(),
    adminClient(),
  ],
});

export const { useSession, signIn, signOut, signUp } = authClient;

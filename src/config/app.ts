/**
 * Application Configuration
 * Centralized configuration for the application
 */

export const appConfig = {
  // Base URLs
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  authUrl: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

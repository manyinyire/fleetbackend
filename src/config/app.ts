/**
 * Application Configuration
 * Centralized configuration for the application
 */

import { apiLogger } from '@/lib/logger';

/**
 * Validates and returns a URL, ensuring HTTPS in production
 * @param url - The URL to validate
 * @param name - The name of the environment variable (for error messages)
 * @param allowHttp - Whether to allow HTTP in development
 * @returns The validated URL
 */
function validateUrl(url: string | undefined, name: string, allowHttp = true): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  // In test mode, allow localhost
  if (isTest && !url) {
    return 'http://localhost:3000';
  }

  // In development, allow localhost if no URL provided
  if (isDevelopment && !url && allowHttp) {
    return 'http://localhost:3000';
  }

  // In production, URL is required
  if (isProduction && !url) {
    throw new Error(
      `${name} environment variable is required in production. ` +
      `Set it to your production domain (e.g., https://yourdomain.com)`
    );
  }

  // If no URL provided (shouldn't happen after above checks), default to localhost
  if (!url) {
    return 'http://localhost:3000';
  }

  // In production, enforce HTTPS for non-localhost URLs
  if (isProduction && !url.startsWith('https://')) {
    const isLocalhost =
      url.startsWith('http://localhost') || url.startsWith('https://localhost');

    if (!isLocalhost) {
      throw new Error(
        `${name} must use HTTPS in production. ` +
        `Current value: ${url}. Update to https://yourdomain.com`
      );
    }
  }

  return url;
}

export const appConfig = {
  // Base URLs with validation
  baseUrl: validateUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    'NEXT_PUBLIC_APP_URL'
  ),
  authUrl: validateUrl(
    process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
    'BETTER_AUTH_URL or NEXTAUTH_URL'
  ),

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// Log configuration on startup (development only)
if (appConfig.isDevelopment) {
  apiLogger.info({
    baseUrl: appConfig.baseUrl,
    authUrl: appConfig.authUrl,
    environment: process.env.NODE_ENV
  }, '🔧 App Configuration loaded');
}

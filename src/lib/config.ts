/**
 * Application Configuration
 *
 * Centralized configuration for all application constants.
 * Use environment variables where possible, with sensible defaults.
 */

export const config = {
  // Session Configuration
  session: {
    rememberMeDuration: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    regularDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '2', 10),
  },

  // Pagination Defaults
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT || '10', 10),
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT || '100', 10),
    defaultPage: 1,
  },

  // Query Limits
  query: {
    recentRecordsLimit: 10,
    relatedRecordsLimit: 5,
  },

  // Security
  security: {
    defaultIpWhitelist: ['127.0.0.1', '::1'],
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Platform Settings (Fallbacks)
  platform: {
    name: process.env.PLATFORM_NAME || 'Azaire Fleet Manager',
    url: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Africa/Harare',
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
  },

  // Email Configuration
  email: {
    fromName: process.env.SMTP_FROM_NAME || 'Azaire Fleet Manager',
    fromEmail: process.env.SMTP_USER || 'noreply@azaire.com',
  },

  // Environment
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
} as const;

/**
 * Validate required environment variables
 */
export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Get client-safe configuration (safe to expose to browser)
 */
export function getClientConfig() {
  return {
    platform: {
      name: config.platform.name,
      url: config.platform.url,
    },
    pagination: {
      defaultLimit: config.pagination.defaultLimit,
      maxLimit: config.pagination.maxLimit,
    },
  };
}

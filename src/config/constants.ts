/**
 * Application Constants
 * Centralized constants to avoid magic numbers
 */

export const LIMITS = {
  // Query limits
  DEFAULT_QUERY_LIMIT: 50,
  MAX_QUERY_LIMIT: 1000,

  // Pagination
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
} as const;

export const SESSION = {
  // Session expiry times (in seconds)
  EXPIRY: 60 * 60 * 24 * 7, // 7 days
  UPDATE_AGE: 60 * 60 * 24, // 1 day
  COOKIE_CACHE_MAX_AGE: 60 * 5, // 5 minutes

  // Admin impersonation
  IMPERSONATION_DURATION: 60 * 60, // 1 hour
} as const;

export const OTP = {
  // OTP settings
  LENGTH: 6,
  EXPIRY: 600, // 10 minutes
  ALLOWED_ATTEMPTS: 3,
} as const;

export const RATE_LIMIT = {
  // Rate limiting
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,

  // Auth endpoints
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5,
} as const;

export const ERROR_MESSAGES = {
  // Generic errors
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden: Insufficient permissions',
  NOT_FOUND: 'Resource not found',

  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
  ACCOUNT_CANCELED: 'Your account has been cancelled. Please contact support to reactivate.',

  // Tenant errors
  NO_TENANT_CONTEXT: 'No tenant context available',
  TENANT_NOT_FOUND: 'Tenant not found',
  TENANT_SUSPENDED: 'Your account has been suspended. Please contact support.',
  TENANT_CANCELED: 'Your account has been cancelled. Please contact support to reactivate.',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
} as const;

/**
 * Structured Logging with Pino
 *
 * Provides centralized logging functionality for the application.
 * Uses Pino for high-performance JSON logging with proper log levels.
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Create Pino logger instance with appropriate configuration
 * Note: pino-pretty transport is disabled in Next.js to avoid worker thread issues
 */
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Use browser-safe configuration for Next.js
  // pino-pretty transport causes worker thread issues in Next.js server environment
  browser: {
    asObject: true,
  },

  // Base properties included in all logs
  base: {
    env: process.env.NODE_ENV,
    // Add version from package.json if needed
  },

  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'req.headers.authorization',
      'req.headers.cookie',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'twoFactorSecret',
    ],
    remove: true,
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Format timestamps
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

/**
 * Create child logger with context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log levels:
 * - trace: Very detailed debugging information
 * - debug: Debugging information
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Critical errors that cause application failure
 */

/**
 * Database query logger
 */
export const dbLogger = createLogger({ component: 'database' });

/**
 * Authentication logger
 */
export const authLogger = createLogger({ component: 'auth' });

/**
 * API logger
 */
export const apiLogger = createLogger({ component: 'api' });

/**
 * Audit logger (for tracking user actions)
 */
export const auditLogger = createLogger({ component: 'audit' });

/**
 * Background job logger
 */
export const jobLogger = createLogger({ component: 'job' });

/**
 * Helper function to log API requests
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  tenantId?: string,
  duration?: number
) {
  apiLogger.info({
    method,
    path,
    userId,
    tenantId,
    duration,
  }, `${method} ${path}`);
}

/**
 * Helper function to log API errors
 */
export function logApiError(
  method: string,
  path: string,
  error: Error,
  userId?: string,
  tenantId?: string
) {
  apiLogger.error({
    method,
    path,
    userId,
    tenantId,
    err: error,
  }, `Error in ${method} ${path}: ${error.message}`);
}

/**
 * Helper function to log authentication events
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'register' | 'verify' | '2fa_enable' | '2fa_disable' | 'failed_login',
  userId?: string,
  email?: string,
  ipAddress?: string,
  metadata?: Record<string, any>
) {
  authLogger.info({
    event,
    userId,
    email,
    ipAddress,
    ...metadata,
  }, `Auth event: ${event}`);
}

/**
 * Helper function to log database operations
 */
export function logDbOperation(
  operation: 'query' | 'mutation' | 'transaction',
  model: string,
  duration?: number,
  error?: Error
) {
  if (error) {
    dbLogger.error({
      operation,
      model,
      duration,
      err: error,
    }, `Database ${operation} failed on ${model}`);
  } else {
    dbLogger.debug({
      operation,
      model,
      duration,
    }, `Database ${operation} on ${model}`);
  }
}

/**
 * Helper function to log audit trail
 */
export function logAudit(
  action: string,
  userId: string,
  tenantId: string | null,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  auditLogger.info({
    action,
    userId,
    tenantId,
    entityType,
    entityId,
    ...metadata,
  }, `Audit: ${action} on ${entityType}`);
}

/**
 * Helper function to log background jobs
 */
export function logJob(
  jobName: string,
  status: 'started' | 'completed' | 'failed',
  duration?: number,
  error?: Error,
  metadata?: Record<string, any>
) {
  if (status === 'failed' && error) {
    jobLogger.error({
      jobName,
      status,
      duration,
      err: error,
      ...metadata,
    }, `Job ${jobName} failed`);
  } else {
    jobLogger.info({
      jobName,
      status,
      duration,
      ...metadata,
    }, `Job ${jobName} ${status}`);
  }
}

/**
 * Helper to measure execution time
 */
export function measureTime<T>(
  operation: () => T | Promise<T>,
  onComplete: (duration: number) => void
): T | Promise<T> {
  const start = Date.now();
  const result = operation();

  if (result instanceof Promise) {
    return result.finally(() => {
      onComplete(Date.now() - start);
    }) as Promise<T>;
  }

  onComplete(Date.now() - start);
  return result;
}

export default logger;

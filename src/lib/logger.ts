/**
 * Centralized logging service using Pino
 * Replaces console.log/error throughout the application
 */
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss',
        },
      }
    : undefined,
  // Redact sensitive information in production
  redact: isProduction
    ? {
        paths: [
          'password',
          'token',
          'secret',
          'authorization',
          'cookie',
          'req.headers.authorization',
          'req.headers.cookie',
        ],
        censor: '***REDACTED***',
      }
    : undefined,
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Log HTTP request/response
 */
export function logHttpRequest(req: {
  method: string;
  url: string;
  headers?: Record<string, unknown>;
}) {
  logger.info({
    type: 'http_request',
    method: req.method,
    url: req.url,
    userAgent: req.headers?.['user-agent'],
  });
}

/**
 * Log HTTP response
 */
export function logHttpResponse(
  req: { method: string; url: string },
  res: { status: number },
  duration: number
) {
  logger.info({
    type: 'http_response',
    method: req.method,
    url: req.url,
    status: res.status,
    duration: `${duration}ms`,
  });
}

/**
 * Log database query
 */
export function logDatabaseQuery(query: string, duration: number) {
  logger.debug({
    type: 'database_query',
    query,
    duration: `${duration}ms`,
  });
}

/**
 * Log authentication event
 */
export function logAuthEvent(event: string, userId?: string, details?: Record<string, unknown>) {
  logger.info({
    type: 'auth_event',
    event,
    userId,
    ...details,
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(event: string, details: Record<string, unknown>) {
  logger.warn({
    type: 'security_event',
    event,
    ...details,
  });
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
      name: error.name,
    },
    ...context,
  });
}

export default logger;

/**
 * Centralized Error Handling System
 *
 * Provides consistent error handling, logging, and user-friendly error messages
 * across the entire application.
 */

import { apiLogger } from './logger';
import { Prisma } from '@prisma/client';

export enum ErrorCode {
  // Authentication Errors (1xxx)
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  INVALID_CREDENTIALS = 'AUTH_004',

  // Validation Errors (2xxx)
  VALIDATION_ERROR = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  MISSING_REQUIRED_FIELD = 'VAL_003',

  // Resource Errors (3xxx)
  NOT_FOUND = 'RES_001',
  ALREADY_EXISTS = 'RES_002',
  RESOURCE_LOCKED = 'RES_003',

  // Business Logic Errors (4xxx)
  LIMIT_EXCEEDED = 'BUS_001',
  INSUFFICIENT_PERMISSIONS = 'BUS_002',
  INVALID_STATE = 'BUS_003',
  DUPLICATE_OPERATION = 'BUS_004',

  // Payment Errors (5xxx)
  PAYMENT_FAILED = 'PAY_001',
  PAYMENT_PENDING = 'PAY_002',
  PAYMENT_CANCELLED = 'PAY_003',
  INSUFFICIENT_FUNDS = 'PAY_004',

  // Database Errors (6xxx)
  DATABASE_ERROR = 'DB_001',
  UNIQUE_CONSTRAINT = 'DB_002',
  FOREIGN_KEY_CONSTRAINT = 'DB_003',

  // External Service Errors (7xxx)
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  NETWORK_ERROR = 'EXT_002',
  TIMEOUT_ERROR = 'EXT_003',

  // System Errors (9xxx)
  INTERNAL_SERVER_ERROR = 'SYS_001',
  SERVICE_UNAVAILABLE = 'SYS_002',
  MAINTENANCE_MODE = 'SYS_003',
}

export interface AppErrorDetails {
  code: ErrorCode;
  message: string;
  userMessage?: string; // User-friendly message
  details?: any;
  statusCode?: number;
  retryable?: boolean;
  action?: string; // Suggested action for the user
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly details?: any;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly action?: string;

  constructor(errorDetails: AppErrorDetails) {
    super(errorDetails.message);
    this.name = 'AppError';
    this.code = errorDetails.code;
    this.userMessage = errorDetails.userMessage || errorDetails.message;
    this.details = errorDetails.details;
    this.statusCode = errorDetails.statusCode || 500;
    this.retryable = errorDetails.retryable || false;
    this.action = errorDetails.action;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
      details: this.details,
      retryable: this.retryable,
      action: this.action,
    };
  }
}

/**
 * Handle Prisma errors and convert them to AppError
 */
export function handlePrismaError(error: any): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const fields = error.meta?.target as string[];
        return new AppError({
          code: ErrorCode.UNIQUE_CONSTRAINT,
          message: `Unique constraint violation on ${fields?.join(', ')}`,
          userMessage: `A record with this ${fields?.[0] || 'value'} already exists`,
          statusCode: 409,
          details: { fields },
        });

      case 'P2003':
        // Foreign key constraint violation
        return new AppError({
          code: ErrorCode.FOREIGN_KEY_CONSTRAINT,
          message: 'Foreign key constraint violation',
          userMessage: 'Referenced record does not exist',
          statusCode: 400,
        });

      case 'P2025':
        // Record not found
        return new AppError({
          code: ErrorCode.NOT_FOUND,
          message: 'Record not found',
          userMessage: 'The requested resource was not found',
          statusCode: 404,
        });

      default:
        return new AppError({
          code: ErrorCode.DATABASE_ERROR,
          message: `Database error: ${error.code}`,
          userMessage: 'A database error occurred. Please try again.',
          statusCode: 500,
          retryable: true,
          details: { code: error.code },
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Database validation error',
      userMessage: 'Invalid data provided. Please check your input.',
      statusCode: 400,
      details: { error: error.message },
    });
  }

  // Default database error
  return new AppError({
    code: ErrorCode.DATABASE_ERROR,
    message: 'Database error',
    userMessage: 'A database error occurred. Please try again.',
    statusCode: 500,
    retryable: true,
  });
}

/**
 * Handle common errors and convert them to AppError
 */
export function handleCommonError(error: any): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError) {
    return handlePrismaError(error);
  }

  // Network/Fetch errors
  if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
    return new AppError({
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network request failed',
      userMessage: 'Unable to connect to the service. Please check your connection.',
      statusCode: 503,
      retryable: true,
    });
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
    return new AppError({
      code: ErrorCode.TIMEOUT_ERROR,
      message: 'Request timeout',
      userMessage: 'The request took too long. Please try again.',
      statusCode: 504,
      retryable: true,
    });
  }

  // Generic error
  return new AppError({
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: error.message || 'Internal server error',
    userMessage: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
    retryable: true,
  });
}

/**
 * Log and format error for API response
 */
export function logAndFormatError(error: any, context?: Record<string, any>) {
  const appError = handleCommonError(error);

  // Log error with context
  apiLogger.error({
    err: error,
    errorCode: appError.code,
    context,
  }, appError.message);

  return {
    error: appError.toJSON(),
    statusCode: appError.statusCode,
  };
}

/**
 * Create specific error types for common scenarios
 */
export const Errors = {
  notFound: (resource: string) => new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `${resource} not found`,
    userMessage: `The requested ${resource.toLowerCase()} was not found`,
    statusCode: 404,
  }),

  unauthorized: (message?: string) => new AppError({
    code: ErrorCode.UNAUTHORIZED,
    message: message || 'Unauthorized',
    userMessage: 'You are not authorized to perform this action',
    statusCode: 401,
    action: 'Please sign in to continue',
  }),

  forbidden: (message?: string) => new AppError({
    code: ErrorCode.FORBIDDEN,
    message: message || 'Forbidden',
    userMessage: 'You do not have permission to perform this action',
    statusCode: 403,
  }),

  validationError: (message: string, details?: any) => new AppError({
    code: ErrorCode.VALIDATION_ERROR,
    message,
    userMessage: message,
    statusCode: 400,
    details,
  }),

  alreadyExists: (resource: string) => new AppError({
    code: ErrorCode.ALREADY_EXISTS,
    message: `${resource} already exists`,
    userMessage: `A ${resource.toLowerCase()} with this information already exists`,
    statusCode: 409,
  }),

  limitExceeded: (resource: string, limit: number | string, suggestedAction?: string) => new AppError({
    code: ErrorCode.LIMIT_EXCEEDED,
    message: `${resource} limit exceeded`,
    userMessage: `You have reached your ${resource.toLowerCase()} limit (${limit})`,
    statusCode: 403,
    action: suggestedAction || 'Please upgrade your plan to add more',
    details: { limit },
  }),

  paymentPending: (invoiceNumber: string) => new AppError({
    code: ErrorCode.PAYMENT_PENDING,
    message: 'Payment already pending for this invoice',
    userMessage: 'There is already a pending payment for this invoice',
    statusCode: 409,
    action: 'Please complete the pending payment or contact support',
    details: { invoiceNumber },
  }),

  paymentFailed: (reason?: string) => new AppError({
    code: ErrorCode.PAYMENT_FAILED,
    message: `Payment failed: ${reason || 'Unknown reason'}`,
    userMessage: 'Payment could not be processed. Please try again or use a different payment method.',
    statusCode: 400,
    retryable: true,
    details: { reason },
  }),

  invalidState: (message: string, currentState?: string) => new AppError({
    code: ErrorCode.INVALID_STATE,
    message,
    userMessage: message,
    statusCode: 400,
    details: { currentState },
  }),

  externalServiceError: (service: string, error?: string) => new AppError({
    code: ErrorCode.EXTERNAL_SERVICE_ERROR,
    message: `External service error: ${service}`,
    userMessage: `Unable to connect to ${service}. Please try again later.`,
    statusCode: 503,
    retryable: true,
    details: { service, error },
  }),
};

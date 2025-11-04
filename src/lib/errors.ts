/**
 * Error Handling Utilities
 *
 * Provides standardized error handling for the application including:
 * - Custom error classes
 * - Prisma error handling
 * - RLS (Row-Level Security) error handling
 * - API error responses
 */

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

/**
 * Custom Application Errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class TenantError extends AppError {
  constructor(message: string) {
    super(message, 403, 'TENANT_ERROR');
    this.name = 'TenantError';
  }
}

/**
 * Prisma Error Handler
 * Converts Prisma errors into user-friendly errors
 */
export function handlePrismaError(error: any): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      // Unique constraint violation
      case 'P2002': {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return new ConflictError(
          `A record with this ${field} already exists`
        );
      }

      // Record not found
      case 'P2025':
        return new NotFoundError('Record');

      // Foreign key constraint violation
      case 'P2003':
        return new ValidationError(
          'This record is referenced by other records and cannot be deleted'
        );

      // Record does not exist (for update/delete)
      case 'P2016':
        return new NotFoundError('Record');

      // Row Level Security policy violation
      case 'P2034':
        return new TenantError(
          'You do not have permission to access this resource'
        );

      // Invalid input value
      case 'P2006':
        return new ValidationError('Invalid input value provided');

      // Null constraint violation
      case 'P2011':
        return new ValidationError('Required field is missing');

      // Value too long
      case 'P2000':
        return new ValidationError('Input value is too long for field');

      default:
        return new AppError(
          'A database error occurred',
          500,
          error.code
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided to database');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(
      'Database connection failed',
      503,
      'DATABASE_CONNECTION_ERROR'
    );
  }

  // Unknown Prisma error
  return new AppError('An unexpected database error occurred', 500);
}

/**
 * Generic Error Handler
 * Handles all types of errors and returns appropriate response
 */
export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
  errors?: Record<string, string[]>;
} {
  // Handle known application errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      errors: error instanceof ValidationError ? error.errors : undefined,
    };
  }

  // Handle Prisma errors
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    const appError = handlePrismaError(error);
    return {
      message: appError.message,
      statusCode: appError.statusCode,
      code: appError.code,
    };
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any;
    const errors: Record<string, string[]> = {};

    zodError.issues?.forEach((issue: any) => {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    });

    return {
      message: 'Validation failed',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      errors,
    };
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    return {
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(error: unknown): NextResponse {
  const errorData = handleError(error);

  return NextResponse.json(
    {
      error: errorData.message,
      code: errorData.code,
      ...(errorData.errors && { errors: errorData.errors }),
    },
    { status: errorData.statusCode }
  );
}

/**
 * Try-catch wrapper for async operations
 * Automatically handles errors and returns typed results
 */
export async function tryCatch<T>(
  operation: () => Promise<T>
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (err) {
    const error =
      err instanceof AppError ? err : new AppError(handleError(err).message);
    return { error };
  }
}

/**
 * Async error handler for API routes
 * Wraps route handlers and automatically handles errors
 */
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

/**
 * Check if error is a specific Prisma error code
 */
export function isPrismaError(error: any, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}

/**
 * Check if error is an RLS violation
 */
export function isRLSViolation(error: any): boolean {
  return isPrismaError(error, 'P2034');
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueConstraintViolation(error: any): boolean {
  return isPrismaError(error, 'P2002');
}

/**
 * Check if error is a foreign key constraint violation
 */
export function isForeignKeyViolation(error: any): boolean {
  return isPrismaError(error, 'P2003');
}

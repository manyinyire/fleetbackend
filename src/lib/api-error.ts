/**
 * Structured error handling for API routes
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger, logError } from './logger';
import { Prisma } from '@prisma/client';

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse {
  // Log the error
  if (error instanceof Error) {
    logError(error, context);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.CONFLICT,
            message: 'A record with this value already exists',
            details: { fields: error.meta?.target },
          },
        },
        { status: 409 }
      );
    }

    // P2025: Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Resource not found',
          },
        },
        { status: 404 }
      );
    }

    // Other Prisma errors
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database operation failed',
        },
      },
      { status: 500 }
    );
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle generic errors
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error instanceof Error
      ? error.message
      : 'Unknown error';

  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message,
      },
    },
    { status: 500 }
  );
}

/**
 * Common API errors
 */
export const ApiErrors = {
  unauthorized: () =>
    new ApiError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401),
  
  forbidden: (message = 'Access denied') =>
    new ApiError(ErrorCode.FORBIDDEN, message, 403),
  
  notFound: (resource = 'Resource') =>
    new ApiError(ErrorCode.NOT_FOUND, `${resource} not found`, 404),
  
  conflict: (message: string) =>
    new ApiError(ErrorCode.CONFLICT, message, 409),
  
  badRequest: (message: string) =>
    new ApiError(ErrorCode.BAD_REQUEST, message, 400),
  
  rateLimitExceeded: () =>
    new ApiError(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many requests', 429),
  
  internalError: (message = 'Internal server error') =>
    new ApiError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500),
};

/**
 * Wrap an async route handler with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, {
        handler: handler.name,
        args: args.map((arg) => arg?.toString?.() || typeof arg),
      });
    }
  }) as T;
}

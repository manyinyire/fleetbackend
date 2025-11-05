/**
 * API Error Handler Wrapper
 * Provides consistent error handling across all API routes
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { ERROR_MESSAGES } from '@/config/constants';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Wraps an API handler with standardized error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  context: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Log error with context
      logger.error({ err: error, context }, 'API error occurred');

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: ERROR_MESSAGES.VALIDATION_ERROR,
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            return NextResponse.json(
              { error: 'A record with this value already exists' },
              { status: 409 }
            );
          case 'P2025':
            return NextResponse.json(
              { error: ERROR_MESSAGES.NOT_FOUND },
              { status: 404 }
            );
          default:
            logger.error({ err: error, code: error.code }, 'Prisma error');
            return NextResponse.json(
              { error: 'Database error occurred' },
              { status: 500 }
            );
        }
      }

      // Handle custom API errors
      if (error instanceof Error) {
        // Check for common error patterns
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: ERROR_MESSAGES.UNAUTHORIZED },
            { status: 401 }
          );
        }

        if (error.message.includes('Forbidden')) {
          return NextResponse.json(
            { error: ERROR_MESSAGES.FORBIDDEN },
            { status: 403 }
          );
        }

        if (error.message.includes('Not found') || error.message.includes('not found')) {
          return NextResponse.json(
            { error: ERROR_MESSAGES.NOT_FOUND },
            { status: 404 }
          );
        }

        // Generic error with message
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      // Unknown error
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: 500 }
      );
    }
  };
}

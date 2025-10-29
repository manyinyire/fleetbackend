/**
 * Unit tests for API error handling
 */
import { describe, it, expect } from '@jest/globals';
import { ApiError, ErrorCode, ApiErrors, createErrorResponse } from '@/lib/api-error';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';

describe('API Error Handling', () => {
  describe('ApiError', () => {
    it('should create an API error', () => {
      const error = new ApiError(
        ErrorCode.BAD_REQUEST,
        'Invalid input',
        400,
        { field: 'email' }
      );

      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('ApiErrors', () => {
    it('should create unauthorized error', () => {
      const error = ApiErrors.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should create forbidden error', () => {
      const error = ApiErrors.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should create not found error', () => {
      const error = ApiErrors.notFound('User');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create conflict error', () => {
      const error = ApiErrors.conflict('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Email already exists');
    });
  });

  describe('createErrorResponse', () => {
    it('should handle ZodError', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(0),
      });

      try {
        schema.parse({ email: 'invalid', age: -1 });
      } catch (error) {
        const response = createErrorResponse(error);
        expect(response.status).toBe(400);
      }
    });

    it('should handle Prisma unique constraint error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        }
      );

      const response = createErrorResponse(prismaError);
      expect(response.status).toBe(409);
    });

    it('should handle Prisma not found error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      const response = createErrorResponse(prismaError);
      expect(response.status).toBe(404);
    });

    it('should handle ApiError', () => {
      const error = new ApiError(
        ErrorCode.BAD_REQUEST,
        'Invalid input',
        400
      );

      const response = createErrorResponse(error);
      expect(response.status).toBe(400);
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error);
      expect(response.status).toBe(500);
    });
  });
});

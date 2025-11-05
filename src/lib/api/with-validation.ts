/**
 * Validation Wrapper
 * Validates request body against Zod schema
 */
import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';

export interface ValidatedRequest<T> extends NextRequest {
  validatedData: T;
}

/**
 * Wraps a handler to validate request body against a schema
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T, request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return handler(validatedData, request);
  };
}

/**
 * Validates query parameters against a schema
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T, request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const { searchParams } = new URL(request.url);
    const params: Record<string, any> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const validatedData = schema.parse(params);
    return handler(validatedData, request);
  };
}

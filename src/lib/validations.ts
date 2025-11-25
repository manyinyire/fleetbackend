/**
 * Validation Helpers
 *
 * This file now only contains helper functions for validation.
 * All schemas have been moved to src/lib/schemas/ for better organization.
 * 
 * @deprecated Import schemas directly from '@/lib/schemas' instead
 * @see src/lib/schemas/index.ts
 */

import { z } from 'zod';

// Re-export all schemas from centralized location
export * from './schemas';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate request body against a schema
 * Throws ValidationError if validation fails
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

/**
 * Validate request params against a schema
 * Throws ValidationError if validation fails
 */
export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  return schema.parse(params);
}

/**
 * Safe validation that returns result instead of throwing
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}

import { z } from 'zod';

/**
 * Common validation schemas for admin routes
 */

// Tenant schemas
export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).default('FREE')
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional()
});

export const changeTenantPlanSchema = z.object({
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM'])
});

export const changeTenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']),
  reason: z.string().optional()
});

// User schemas
export const updateUserRoleSchema = z.object({
  role: z.enum(['TENANT_ADMIN', 'USER', 'SUPER_ADMIN'])
});

export const changePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

// Search/filter schemas
export const tenantFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Validate request body with a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns Validation result with success flag and data or errors
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });

      return { success: false, errors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      errors: { _error: 'Validation failed' }
    };
  }
}

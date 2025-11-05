/**
 * Common Validation Schemas
 */
import { z } from 'zod';

// Common field validations
export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

export const urlSchema = z.string().url('Invalid URL');

export const currencyAmountSchema = z.union([
  z.number().positive('Amount must be positive'),
  z.string().regex(/^\d+\.?\d{0,2}$/, 'Invalid currency amount'),
]);

export const dateSchema = z.union([
  z.date(),
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
]);

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Filter schemas
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DateRangeFilter = z.infer<typeof dateRangeSchema>;

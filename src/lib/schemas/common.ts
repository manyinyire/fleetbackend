import { z } from 'zod';

// ============================================
// COMMON SCHEMAS (Pagination, Filters, etc.)
// ============================================

/**
 * Pagination schema for list endpoints
 */
export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Date range schema for filtering
 */
export const dateRangeSchema = z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
});

/**
 * ID schema for route parameters
 */
export const idSchema = z.object({
    id: z.string().cuid('Invalid ID'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type IdInput = z.infer<typeof idSchema>;

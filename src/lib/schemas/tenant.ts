import { z } from 'zod';

// ============================================
// TENANT SCHEMAS
// ============================================

export const tenantCreateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string()
        .min(2, 'Slug must be at least 2 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Invalid phone number').optional(),
    plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

export const tenantIdSchema = z.object({
    id: z.string().cuid('Invalid tenant ID'),
});

export const tenantStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELED']),
});

export type CreateTenantInput = z.infer<typeof tenantCreateSchema>;
export type UpdateTenantInput = z.infer<typeof tenantUpdateSchema>;
export type UpdateTenantStatusInput = z.infer<typeof tenantStatusSchema>;

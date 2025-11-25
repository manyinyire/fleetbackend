import { z } from 'zod';

// ============================================
// INVOICE SCHEMAS
// ============================================

export const invoiceSchema = z.object({
    tenantId: z.string().cuid('Invalid tenant ID'),
    type: z.enum(['SUBSCRIPTION', 'UPGRADE', 'RENEWAL', 'OVERAGE', 'CUSTOM']),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    dueDate: z.string().datetime().or(z.date()),
    plan: z.enum(['FREE', 'BASIC', 'PREMIUM']),
    billingPeriod: z.string().optional(),
    description: z.string().max(500).optional(),
});

export const invoiceUpdateSchema = z.object({
    status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']),
    paidAt: z.string().datetime().or(z.date()).optional(),
});

export const invoiceIdSchema = z.object({
    id: z.string().cuid('Invalid invoice ID'),
});

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof invoiceUpdateSchema>;

import { z } from 'zod';

// ============================================
// INCOME SCHEMAS
// ============================================

export const incomeSchema = z.object({
    vehicleId: z.string().cuid('Invalid vehicle ID').optional(),
    source: z.enum(['REMITTANCE', 'OTHER']),
    amount: z.number().positive('Amount must be positive'),
    date: z.string().datetime().or(z.date()),
    description: z.string().max(500).optional(),
});

export const incomeUpdateSchema = incomeSchema.partial();

export const incomeIdSchema = z.object({
    id: z.string().cuid('Invalid income ID'),
});

export type CreateIncomeInput = z.infer<typeof incomeSchema>;
export type UpdateIncomeInput = z.infer<typeof incomeUpdateSchema>;

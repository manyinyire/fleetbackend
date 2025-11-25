import { z } from 'zod';

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const expenseSchema = z.object({
    vehicleId: z.string().cuid('Invalid vehicle ID').optional(),
    category: z.enum([
        'FUEL',
        'MAINTENANCE',
        'INSURANCE',
        'LICENSE',
        'SALARY',
        'ADMINISTRATIVE',
        'LOAN_PAYMENT',
        'OTHER'
    ]),
    amount: z.number().positive('Amount must be positive'),
    date: z.string().datetime().or(z.date()),
    description: z.string().min(1, 'Description is required'),
    receipt: z.string().url('Invalid receipt URL').optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export const expenseUpdateSchema = expenseSchema.partial();

export const expenseApprovalSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
});

export const expenseIdSchema = z.object({
    id: z.string().cuid('Invalid expense ID'),
});

export type CreateExpenseInput = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof expenseUpdateSchema>;
export type ApproveExpenseInput = z.infer<typeof expenseApprovalSchema>;

import { z } from 'zod';

// ============================================
// REMITTANCE SCHEMAS
// ============================================

export const remittanceSchema = z.object({
    driverId: z.string().cuid('Invalid driver ID'),
    vehicleId: z.string().cuid('Invalid vehicle ID'),
    amount: z.number().positive('Amount must be positive'),
    targetAmount: z.number().positive().optional(),
    date: z.string().datetime().or(z.date()),
    proofOfPayment: z.string().url('Invalid proof of payment URL').optional(),
    notes: z.string().max(500).optional(),
});

export const remittanceUpdateSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    notes: z.string().max(500).optional(),
});

export const remittanceIdSchema = z.object({
    id: z.string().cuid('Invalid remittance ID'),
});

export type CreateRemittanceInput = z.infer<typeof remittanceSchema>;
export type UpdateRemittanceInput = z.infer<typeof remittanceUpdateSchema>;

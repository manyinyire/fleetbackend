import { z } from 'zod';

// ============================================  
// PAYMENT SCHEMAS
// ============================================

export const paymentInitiateSchema = z.object({
    invoiceId: z.string().cuid('Invalid invoice ID'),
    gateway: z.enum(['PAYNOW', 'STRIPE', 'PAYPAL', 'MANUAL']).optional(),
});

export const paymentCallbackSchema = z.object({
    reference: z.string(),
    paynowreference: z.string().optional(),
    pollurl: z.string().url().optional(),
    status: z.string(),
    hash: z.string(),
});

export const paymentIdSchema = z.object({
    id: z.string().cuid('Invalid payment ID'),
});

export type InitiatePaymentInput = z.infer<typeof paymentInitiateSchema>;
export type PaymentCallbackInput = z.infer<typeof paymentCallbackSchema>;

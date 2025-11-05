/**
 * Payment Validation Schemas
 */
import { z } from 'zod';
import { currencyAmountSchema } from './common';

export const paymentStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
]);

export const initiatePaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amount: currencyAmountSchema,
  paymentMethod: z.enum(['paynow', 'manual', 'bank_transfer']),
  phone: z.string().optional(), // For mobile money
  email: z.string().email().optional(),
});

export const paynowCallbackSchema = z.object({
  reference: z.string(),
  paynowreference: z.string(),
  amount: z.union([z.number(), z.string()]),
  status: z.string(),
  hash: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type PaynowCallbackInput = z.infer<typeof paynowCallbackSchema>;

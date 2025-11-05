/**
 * Financial Transaction Validation Schemas
 */
import { z } from 'zod';
import { currencyAmountSchema, dateSchema } from './common';

// Expense validation
export const expenseCategoryEnum = z.enum([
  'FUEL',
  'MAINTENANCE',
  'INSURANCE',
  'TAX',
  'PARKING',
  'TOLL',
  'OTHER',
]);

export const createExpenseSchema = z.object({
  vehicleId: z.string().cuid().optional(),
  category: expenseCategoryEnum,
  amount: currencyAmountSchema,
  date: dateSchema,
  description: z.string().optional(),
  receipt: z.string().url().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// Income validation
export const incomeSourceEnum = z.enum(['REMITTANCE', 'OTHER']);

export const createIncomeSchema = z.object({
  vehicleId: z.string().cuid().optional(),
  source: incomeSourceEnum,
  amount: currencyAmountSchema,
  date: dateSchema,
  description: z.string().optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

// Remittance validation
export const remittanceStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const createRemittanceSchema = z.object({
  driverId: z.string().cuid(),
  vehicleId: z.string().cuid(),
  amount: currencyAmountSchema,
  date: dateSchema,
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

export const updateRemittanceSchema = z.object({
  status: remittanceStatusEnum.optional(),
  notes: z.string().optional(),
  amount: currencyAmountSchema.optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type CreateRemittanceInput = z.infer<typeof createRemittanceSchema>;
export type UpdateRemittanceInput = z.infer<typeof updateRemittanceSchema>;

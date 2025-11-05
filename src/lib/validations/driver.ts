/**
 * Driver Validation Schemas
 */
import { z } from 'zod';
import { emailSchema, phoneSchema } from './common';

export const createDriverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  nationalId: z.string().min(1, 'National ID is required').max(50),
  licenseNumber: z.string().min(1, 'License number is required').max(50),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  homeAddress: z.string().min(1, 'Home address is required'),
  nextOfKin: z.string().min(1, 'Next of kin is required'),
  nextOfKinPhone: phoneSchema,
  hasDefensiveLicense: z.boolean().optional(),
  defensiveLicenseNumber: z.string().optional(),
  defensiveLicenseExpiry: z.string().datetime().optional(),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

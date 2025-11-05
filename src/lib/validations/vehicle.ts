/**
 * Vehicle Validation Schemas
 */
import { z } from 'zod';
import { currencyAmountSchema } from './common';

export const vehicleTypeEnum = z.enum(['CAR', 'OMNIBUS', 'BIKE']);
export const paymentModelEnum = z.enum(['OWNER_PAYS', 'DRIVER_REMITS', 'HYBRID']);

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required').max(20),
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: vehicleTypeEnum,
  initialCost: currencyAmountSchema,
  paymentModel: paymentModelEnum.optional(),
  paymentConfig: z.record(z.any()).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

/**
 * Maintenance Record Validation Schemas
 */
import { z } from 'zod';
import { currencyAmountSchema, dateSchema } from './common';

export const maintenanceTypeEnum = z.enum([
  'ROUTINE_SERVICE',
  'TIRE_REPLACEMENT',
  'BRAKE_SERVICE',
  'ENGINE_REPAIR',
  'ELECTRICAL',
  'BODY_WORK',
  'OTHER',
]);

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().cuid('Invalid vehicle ID'),
  date: dateSchema,
  mileage: z.number().int().positive('Mileage must be a positive number'),
  type: maintenanceTypeEnum,
  description: z.string().min(1, 'Description is required').max(1000),
  cost: currencyAmountSchema,
  provider: z.string().min(1, 'Provider is required').max(200),
  invoice: z.string().max(200).optional(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;

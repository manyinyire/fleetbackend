/**
 * Driver-Vehicle Assignment Validation Schemas
 */
import { z } from 'zod';
import { dateSchema } from './common';

export const createAssignmentSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
  vehicleId: z.string().cuid('Invalid vehicle ID'),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  isPrimary: z.boolean().default(true),
}).refine(
  (data) => {
    // If both dates are provided, endDate must be after startDate
    if (data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const updateAssignmentSchema = z.object({
  endDate: dateSchema.optional(),
  isPrimary: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

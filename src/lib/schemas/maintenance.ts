import { z } from 'zod';

// ============================================
// MAINTENANCE SCHEMAS
// ============================================

export const maintenanceSchema = z.object({
    vehicleId: z.string().cuid('Invalid vehicle ID'),
    date: z.string().datetime().or(z.date()),
    mileage: z.number().int().min(0, 'Mileage cannot be negative'),
    type: z.enum([
        'ROUTINE_SERVICE',
        'TIRE_REPLACEMENT',
        'BRAKE_SERVICE',
        'ENGINE_REPAIR',
        'ELECTRICAL',
        'BODY_WORK',
        'OTHER'
    ]),
    description: z.string().min(1, 'Description is required'),
    cost: z.number().positive('Cost must be positive'),
    provider: z.string().min(1, 'Provider is required'),
    invoice: z.string().url('Invalid invoice URL').optional(),
});

export const maintenanceUpdateSchema = maintenanceSchema.partial();

export const maintenanceIdSchema = z.object({
    id: z.string().cuid('Invalid maintenance record ID'),
});

export type CreateMaintenanceInput = z.infer<typeof maintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof maintenanceUpdateSchema>;

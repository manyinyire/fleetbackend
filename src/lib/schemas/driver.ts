import { z } from 'zod';

// ============================================
// DRIVER SCHEMAS
// ============================================

export const driverSchema = z.object({
    fullName: z.string().min(1, 'Full name is required').max(200),
    nationalId: z.string().min(1, 'National ID is required').max(50),
    licenseNumber: z.string().min(1, 'License number is required').max(50),
    phone: z.string().min(10, 'Invalid phone number').max(20),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    homeAddress: z.string().min(1, 'Home address is required'),
    nextOfKin: z.string().min(1, 'Next of kin is required'),
    nextOfKinPhone: z.string().min(10, 'Invalid next of kin phone').max(20),
    hasDefensiveLicense: z.boolean().optional(),
    defensiveLicenseNumber: z.string().max(50).optional(),
    defensiveLicenseExpiry: z.string().datetime().optional().or(z.date()),
    debtBalance: z.number().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
});

export const driverUpdateSchema = driverSchema.partial();

export const driverIdSchema = z.object({
    id: z.string().cuid('Invalid driver ID'),
});

export type CreateDriverInput = z.infer<typeof driverSchema>;
export type UpdateDriverInput = z.infer<typeof driverUpdateSchema>;

import { z } from 'zod';
import { PaymentModel, VehicleStatus, VehicleType } from '@prisma/client';

export const VehicleTypeEnum = z.nativeEnum(VehicleType);
export const VehicleStatusEnum = z.nativeEnum(VehicleStatus);
export const PaymentModelEnum = z.nativeEnum(PaymentModel);

export const createVehicleBaseSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: VehicleTypeEnum,
  initialCost: z.coerce.number().positive('Initial cost must be positive'),
  currentMileage: z.coerce.number().int().min(0).default(0),
  status: VehicleStatusEnum.default('ACTIVE'),
  paymentModel: PaymentModelEnum,
  paymentConfig: z.any(), // Refined below
});

export const createVehicleSchema = createVehicleBaseSchema.superRefine((data, ctx) => {
  const { paymentModel, paymentConfig } = data;

  if (paymentModel === 'OWNER_PAYS') {
    const schema = z.object({
      percentage: z.coerce.number().min(0).max(100),
      closingDay: z.string(),
    });
    const result = schema.safeParse(paymentConfig);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid config for OWNER_PAYS. Requires 'percentage' and 'closingDay'.",
        path: ['paymentConfig'],
      });
    }
  } else if (paymentModel === 'DRIVER_REMITS') {
    const schema = z.object({
      amount: z.coerce.number().nonnegative(),
      frequency: z.enum(['DAILY', 'WEEKLY']),
    });
    const result = schema.safeParse(paymentConfig);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid config for DRIVER_REMITS. Requires 'amount' and 'frequency'.",
        path: ['paymentConfig'],
      });
    }
  } else if (paymentModel === 'HYBRID') {
    const schema = z.object({
      baseAmount: z.coerce.number().nonnegative(),
      commissionPercentage: z.coerce.number().min(0).max(100),
    });
    const result = schema.safeParse(paymentConfig);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid config for HYBRID. Requires 'baseAmount' and 'commissionPercentage'.",
        path: ['paymentConfig'],
      });
    }
  }
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

// Form schema includes the flat fields for payment configuration
export const vehicleFormSchema = createVehicleBaseSchema.omit({ paymentConfig: true }).extend({
  // Owner Pays fields
  ownerPaysPercentage: z.coerce.number().min(0).max(100).optional(),
  ownerPaysClosingDay: z.string().optional(),
  // Driver Remits fields
  driverRemitsAmount: z.coerce.number().min(0).optional(),
  driverRemitsFrequency: z.string().optional(),
  // Hybrid fields
  hybridBaseAmount: z.coerce.number().min(0).optional(),
  hybridCommissionPercentage: z.coerce.number().min(0).max(100).optional(),
});

export type VehicleFormData = z.infer<typeof vehicleFormSchema>;

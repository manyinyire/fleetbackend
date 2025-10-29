/**
 * Centralized API validation schemas using Zod
 * All API routes should use these schemas for input validation
 */
import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// ============================================
// DRIVER SCHEMAS
// ============================================

export const createDriverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  nationalId: z.string().min(5, 'National ID is required').max(20),
  licenseNumber: z.string().min(1, 'License number is required').max(50),
  phone: z.string().min(10, 'Phone number is required').max(20),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  homeAddress: z.string().min(1, 'Home address is required').max(500),
  nextOfKin: z.string().min(1, 'Next of kin is required').max(100),
  nextOfKinPhone: z.string().min(10, 'Next of kin phone is required').max(20),
  hasDefensiveLicense: z.boolean().default(false),
  defensiveLicenseNumber: z.string().max(50).optional(),
  defensiveLicenseExpiry: z.string().datetime().optional().or(z.string().length(0)),
  paymentModel: z.enum(['OWNER_PAYS', 'DRIVER_REMITS', 'HYBRID']),
  paymentConfig: z.record(z.unknown()),
  debtBalance: z.coerce.number().min(0).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).default('ACTIVE'),
});

export const updateDriverSchema = createDriverSchema.partial();

export const getDriversSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
  paymentModel: z.enum(['OWNER_PAYS', 'DRIVER_REMITS', 'HYBRID']).optional(),
});

// ============================================
// VEHICLE SCHEMAS
// ============================================

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required').max(20),
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: z.enum(['CAR', 'OMNIBUS', 'BIKE']),
  initialCost: z.coerce.number().positive('Initial cost must be positive'),
  currentMileage: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']).default('ACTIVE'),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const getVehiclesSchema = paginationSchema.extend({
  search: z.string().optional(),
  type: z.enum(['CAR', 'OMNIBUS', 'BIKE']).optional(),
  status: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']).optional(),
});

// ============================================
// REMITTANCE SCHEMAS
// ============================================

export const createRemittanceSchema = z.object({
  driverId: z.string().min(1, 'Driver is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().datetime('Invalid date format'),
  notes: z.string().max(500).optional(),
  proofOfPayment: z.string().url().optional(),
});

export const updateRemittanceSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
});

export const getRemittancesSchema = paginationSchema.extend({
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const createExpenseSchema = z.object({
  vehicleId: z.string().optional(),
  category: z.enum(['FUEL', 'MAINTENANCE', 'INSURANCE', 'LICENSE', 'SALARY', 'ADMINISTRATIVE', 'LOAN_PAYMENT', 'OTHER']),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().datetime('Invalid date format'),
  description: z.string().min(1, 'Description is required').max(500),
  receipt: z.string().url().optional(),
});

export const updateExpenseSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  approvedBy: z.string().optional(),
});

export const getExpensesSchema = paginationSchema.extend({
  category: z.enum(['FUEL', 'MAINTENANCE', 'INSURANCE', 'LICENSE', 'SALARY', 'ADMINISTRATIVE', 'LOAN_PAYMENT', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// INCOME SCHEMAS
// ============================================

export const createIncomeSchema = z.object({
  vehicleId: z.string().optional(),
  source: z.enum(['REMITTANCE', 'OTHER']),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().datetime('Invalid date format'),
  description: z.string().max(500).optional(),
});

export const getIncomesSchema = paginationSchema.extend({
  source: z.enum(['REMITTANCE', 'OTHER']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// MAINTENANCE SCHEMAS
// ============================================

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  date: z.string().datetime('Invalid date format'),
  mileage: z.coerce.number().int().min(0, 'Mileage must be non-negative'),
  type: z.enum(['ROUTINE_SERVICE', 'TIRE_REPLACEMENT', 'BRAKE_SERVICE', 'ENGINE_REPAIR', 'ELECTRICAL', 'BODY_WORK', 'OTHER']),
  description: z.string().min(1, 'Description is required').max(500),
  cost: z.coerce.number().positive('Cost must be positive'),
  provider: z.string().min(1, 'Provider is required').max(100),
  invoice: z.string().url().optional(),
});

export const getMaintenanceSchema = paginationSchema.extend({
  vehicleId: z.string().optional(),
  type: z.enum(['ROUTINE_SERVICE', 'TIRE_REPLACEMENT', 'BRAKE_SERVICE', 'ENGINE_REPAIR', 'ELECTRICAL', 'BODY_WORK', 'OTHER']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================
// TENANT SCHEMAS (ADMIN)
// ============================================

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().max(20).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).default('FREE'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELED']).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).optional(),
});

export const getTenantsSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELED']).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).optional(),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberDevice: z.boolean().optional(),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  companyName: z.string().min(1, 'Company name is required').max(100),
  phone: z.string().max(20).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// TYPE EXPORTS
// ============================================

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateRemittanceInput = z.infer<typeof createRemittanceSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

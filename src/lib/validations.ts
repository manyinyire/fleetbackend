/**
 * Centralized Zod Validation Schemas
 *
 * This file contains all input validation schemas for the application.
 * Using centralized schemas ensures consistency and easier maintenance.
 */

import { z } from 'zod';

// ============================================
// VEHICLE SCHEMAS
// ============================================

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required').max(20),
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(2100, 'Invalid year'),
  type: z.enum(['CAR', 'OMNIBUS', 'BIKE'], {
    errorMap: () => ({ message: 'Type must be CAR, OMNIBUS, or BIKE' })
  }),
  initialCost: z.number().positive('Initial cost must be positive'),
  currentMileage: z.number().int().min(0, 'Mileage cannot be negative').optional(),
  status: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']).optional(),
  paymentModel: z.enum(['OWNER_PAYS', 'DRIVER_REMITS', 'HYBRID']),
  paymentConfig: z.record(z.any()), // JSON object
});

export const vehicleUpdateSchema = vehicleSchema.partial();

export const vehicleIdSchema = z.object({
  id: z.string().cuid('Invalid vehicle ID'),
});

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

// ============================================
// REMITTANCE SCHEMAS
// ============================================

export const remittanceSchema = z.object({
  driverId: z.string().cuid('Invalid driver ID'),
  vehicleId: z.string().cuid('Invalid vehicle ID'),
  amount: z.number().positive('Amount must be positive'),
  targetAmount: z.number().positive().optional(),
  date: z.string().datetime().or(z.date()),
  proofOfPayment: z.string().url('Invalid proof of payment URL').optional(),
  notes: z.string().max(500).optional(),
});

export const remittanceUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
});

export const remittanceIdSchema = z.object({
  id: z.string().cuid('Invalid remittance ID'),
});

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

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const expenseSchema = z.object({
  vehicleId: z.string().cuid('Invalid vehicle ID').optional(),
  category: z.enum([
    'FUEL',
    'MAINTENANCE',
    'INSURANCE',
    'LICENSE',
    'SALARY',
    'ADMINISTRATIVE',
    'LOAN_PAYMENT',
    'OTHER'
  ]),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().datetime().or(z.date()),
  description: z.string().min(1, 'Description is required'),
  receipt: z.string().url('Invalid receipt URL').optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export const expenseUpdateSchema = expenseSchema.partial();

export const expenseApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const expenseIdSchema = z.object({
  id: z.string().cuid('Invalid expense ID'),
});

// ============================================
// INCOME SCHEMAS
// ============================================

export const incomeSchema = z.object({
  vehicleId: z.string().cuid('Invalid vehicle ID').optional(),
  source: z.enum(['REMITTANCE', 'OTHER']),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().datetime().or(z.date()),
  description: z.string().max(500).optional(),
});

export const incomeUpdateSchema = incomeSchema.partial();

export const incomeIdSchema = z.object({
  id: z.string().cuid('Invalid income ID'),
});

// ============================================
// INVOICE SCHEMAS
// ============================================

export const invoiceSchema = z.object({
  tenantId: z.string().cuid('Invalid tenant ID'),
  type: z.enum(['SUBSCRIPTION', 'UPGRADE', 'RENEWAL', 'OVERAGE', 'CUSTOM']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  dueDate: z.string().datetime().or(z.date()),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']),
  billingPeriod: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const invoiceUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']),
  paidAt: z.string().datetime().or(z.date()).optional(),
});

export const invoiceIdSchema = z.object({
  id: z.string().cuid('Invalid invoice ID'),
});

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const paymentInitiateSchema = z.object({
  invoiceId: z.string().cuid('Invalid invoice ID'),
  gateway: z.enum(['PAYNOW', 'STRIPE', 'PAYPAL', 'MANUAL']).optional(),
});

export const paymentCallbackSchema = z.object({
  reference: z.string(),
  paynowreference: z.string().optional(),
  pollurl: z.string().url().optional(),
  status: z.string(),
  hash: z.string(),
});

export const paymentIdSchema = z.object({
  id: z.string().cuid('Invalid payment ID'),
});

// ============================================
// USER & AUTH SCHEMAS
// ============================================

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  tenantName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(6, 'Invalid verification code').max(6),
  email: z.string().email('Invalid email address'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ============================================
// TENANT SCHEMAS
// ============================================

export const tenantCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

export const tenantIdSchema = z.object({
  id: z.string().cuid('Invalid tenant ID'),
});

export const tenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELED']),
});

// ============================================
// PAGINATION & FILTERING SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate request body against a schema
 * Throws ValidationError if validation fails
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

/**
 * Validate request params against a schema
 * Throws ValidationError if validation fails
 */
export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  return schema.parse(params);
}

/**
 * Safe validation that returns result instead of throwing
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown) {
  return schema.safeParse(data);
}

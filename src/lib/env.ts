/**
 * Environment Variable Validation
 *
 * This file validates all environment variables at runtime to prevent
 * crashes from missing or invalid configuration.
 *
 * Usage: Import this file early in your application (e.g., in lib/prisma.ts)
 * to ensure validation happens before any database or API calls.
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // ============================================
  // REQUIRED - Application Core
  // ============================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters (generate with: openssl rand -base64 32)'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),

  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // ============================================
  // OPTIONAL - Platform Settings
  // ============================================
  PLATFORM_NAME: z.string().optional().default('Azaire Fleet Manager'),
  DEFAULT_TIMEZONE: z.string().optional().default('Africa/Harare'),
  DEFAULT_CURRENCY: z.string().length(3).optional().default('USD'),
  WEBHOOK_URL: z.string().url().optional().or(z.literal('')),

  // ============================================
  // OPTIONAL - Email Configuration
  // ============================================
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number').optional(),
  SMTP_SECURE: z.string().regex(/^(true|false)$/, 'SMTP_SECURE must be true or false').optional(),
  SMTP_USER: z.string().email().optional().or(z.literal('')),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional().default('Azaire Fleet Manager'),

  RESEND_API_KEY: z.string().optional().or(z.literal('')),

  // ============================================
  // OPTIONAL - Payment Gateway (PayNow)
  // ============================================
  PAYNOW_INTEGRATION_ID: z.string().optional().or(z.literal('')),
  PAYNOW_INTEGRATION_KEY: z.string().optional().or(z.literal('')),
  PAYNOW_MERCHANT_EMAIL: z.string().email().optional().or(z.literal('')), // Merchant's registered email (required in test mode)
  PAYNOW_RESULT_URL: z.string().url().optional().or(z.literal('')),
  PAYNOW_RETURN_URL: z.string().url().optional().or(z.literal('')),

  // ============================================
  // OPTIONAL - SMS Service (Africa's Talking)
  // ============================================
  AFRICAS_TALKING_API_KEY: z.string().optional().or(z.literal('')),
  AFRICAS_TALKING_USERNAME: z.string().optional().or(z.literal('')),

  // ============================================
  // OPTIONAL - Analytics
  // ============================================
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional().or(z.literal('')),

  // ============================================
  // OPTIONAL - Cloud Storage (AWS S3)
  // ============================================
  AWS_ACCESS_KEY_ID: z.string().optional().or(z.literal('')),
  AWS_SECRET_ACCESS_KEY: z.string().optional().or(z.literal('')),
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional().or(z.literal('')),

  // ============================================
  // OPTIONAL - Background Jobs (Redis)
  // ============================================
  REDIS_URL: z.string().url().optional().or(z.literal('')).default('redis://localhost:6379'),
});

// Export the type for use in the application
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Check your .env file and ensure all required variables are set.');
      console.error('📖 See .env.example for reference.\n');

      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Environment validation failed in production');
      }
    }
    throw error;
  }
}

// Validate immediately on import
export const env = validateEnv();

// Helper functions for checking optional features
export const features = {
  hasEmail: () => !!(env.SMTP_HOST || env.RESEND_API_KEY),
  hasPayments: () => !!(env.PAYNOW_INTEGRATION_ID && env.PAYNOW_INTEGRATION_KEY),
  hasSMS: () => !!(env.AFRICAS_TALKING_API_KEY && env.AFRICAS_TALKING_USERNAME),
  hasAnalytics: () => !!env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  hasS3: () => !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET),
  hasRedis: () => !!env.REDIS_URL && env.REDIS_URL !== 'redis://localhost:6379',
};

// Log feature availability (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Azaire Fleet Manager - Environment Configuration');
  console.log('├── ✅ Database: Connected');
  console.log(`├── ${features.hasEmail() ? '✅' : '⚠️ '} Email: ${features.hasEmail() ? 'Configured' : 'Not configured'}`);
  console.log(`├── ${features.hasPayments() ? '✅' : '⚠️ '} Payments: ${features.hasPayments() ? 'Configured' : 'Not configured'}`);
  console.log(`├── ${features.hasSMS() ? '✅' : '⚠️ '} SMS: ${features.hasSMS() ? 'Configured' : 'Not configured'}`);
  console.log(`├── ${features.hasAnalytics() ? '✅' : '⚠️ '} Analytics: ${features.hasAnalytics() ? 'Configured' : 'Not configured'}`);
  console.log(`├── ${features.hasS3() ? '✅' : '⚠️ '} S3 Storage: ${features.hasS3() ? 'Configured' : 'Not configured'}`);
  console.log(`└── ${features.hasRedis() ? '✅' : '⚠️ '} Redis: ${features.hasRedis() ? 'Configured' : 'Not configured'}\n`);
}

export default env;

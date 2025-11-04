/**
 * Migration: Add PlatformSettings model
 * 
 * This migration creates the platform_settings table to store
 * platform-wide configuration settings in the database.
 * 
 * Run with: npx prisma migrate dev --name add_platform_settings
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating platform settings...');

  // Create default platform settings if they don't exist
  const existingSettings = await prisma.platformSettings.findFirst();
  
  if (!existingSettings) {
    await prisma.platformSettings.create({
      data: {
        id: 'default-platform-settings',
        platformName: process.env.PLATFORM_NAME || 'Azaire Fleet Manager',
        platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://azaire.com',
        defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Africa/Harare',
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
        allowSignups: true,
        requireEmailVerification: true,
        requireAdminApproval: false,
        enableTrials: true,
        trialDuration: 30,
        requirePaymentUpfront: true,
        failedLoginAttempts: 5,
        emailNotifications: true,
        smsNotifications: false,
        webhookUrl: process.env.WEBHOOK_URL || null,
        alertFrequency: 'immediate',
        maintenanceMode: false,
      },
    });
    
    console.log('✅ Default platform settings created');
  } else {
    console.log('✅ Platform settings already exist');
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


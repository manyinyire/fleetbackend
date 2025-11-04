/**
 * Setup Platform Settings
 * Creates the PlatformSettings table and inserts default values
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPlatformSettings() {
  try {
    console.log('Setting up PlatformSettings...');

    // Check if table exists by trying to query it
    const existing = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'platform_settings'
      );
    ` as Array<{ exists: boolean }>;

    if (existing[0]?.exists) {
      console.log('✅ PlatformSettings table already exists');
      
      // Check if default settings exist
      const settings = await prisma.platformSettings.findFirst();
      if (settings) {
        console.log('✅ Default platform settings already exist');
        return;
      }
    } else {
      // Create table
      console.log('Creating platform_settings table...');
      await prisma.$executeRaw`
        CREATE TABLE "platform_settings" (
          "id" TEXT NOT NULL,
          "platformName" TEXT NOT NULL DEFAULT 'Azaire Fleet Manager',
          "platformUrl" TEXT NOT NULL DEFAULT 'https://azaire.com',
          "defaultTimezone" TEXT NOT NULL DEFAULT 'Africa/Harare',
          "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
          "allowSignups" BOOLEAN NOT NULL DEFAULT true,
          "requireEmailVerification" BOOLEAN NOT NULL DEFAULT true,
          "requireAdminApproval" BOOLEAN NOT NULL DEFAULT false,
          "enableTrials" BOOLEAN NOT NULL DEFAULT true,
          "trialDuration" INTEGER NOT NULL DEFAULT 30,
          "requirePaymentUpfront" BOOLEAN NOT NULL DEFAULT true,
          "failedLoginAttempts" INTEGER NOT NULL DEFAULT 5,
          "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
          "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
          "webhookUrl" TEXT,
          "alertFrequency" TEXT NOT NULL DEFAULT 'immediate',
          "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ PlatformSettings table created');
    }

    // Insert default settings
    const defaultSettings = await prisma.platformSettings.findFirst();
    if (!defaultSettings) {
      console.log('Inserting default platform settings...');
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
    }

    console.log('✅ PlatformSettings setup complete!');
  } catch (error: any) {
    if (error.code === 'P2002' || error.message?.includes('already exists')) {
      console.log('✅ PlatformSettings already set up');
    } else {
      console.error('❌ Error setting up PlatformSettings:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupPlatformSettings()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


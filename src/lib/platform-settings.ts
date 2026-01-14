import { cache } from 'react';
import { prisma } from './prisma';
import { apiLogger } from './logger';

/**
 * Platform Settings Utility
 * 
 * This utility fetches platform-wide settings from the database.
 * These settings are used across the entire application for:
 * - Platform name (displayed in headers, titles, emails)
 * - Platform URL (used in emails, links)
 * - Platform address (shown in invoices, emails)
 * - Platform email (contact/support email)
 * - Maintenance mode (blocks access when enabled)
 */

export interface PlatformSettings {
  id: string;
  platformName: string;
  platformUrl: string;
  platformLogo: string | null;
  logoText: string | null;
  primaryColor: string;
  platformAddress: string | null;
  platformEmail: string | null;
  defaultTimezone: string;
  defaultCurrency: string;
  defaultDateFormat: string;
  allowSignups: boolean;
  requireEmailVerification: boolean;
  requireAdminApproval: boolean;
  enableTrials: boolean;
  trialDuration: number;
  requirePaymentUpfront: boolean;
  failedLoginAttempts: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  webhookUrl: string | null;
  alertFrequency: string;
  maintenanceMode: boolean;
  invoicePrefix: string;
  invoiceFooter: string | null;
  taxNumber: string | null;
  bankDetails: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get platform settings from database
 * Uses React cache for server components
 */
export const getPlatformSettings = cache(async (): Promise<PlatformSettings | null> => {
  try {
    const settings = await prisma.platformSettings.findFirst();
    return settings;
  } catch (error) {
    apiLogger.error({ err: error }, 'Error fetching platform settings:');
    return null;
  }
});

/**
 * Get platform settings with defaults
 * Returns default values if settings don't exist
 */
export const getPlatformSettingsWithDefaults = cache(async (): Promise<PlatformSettings> => {
  const settings = await getPlatformSettings();
  
  if (settings) {
    return settings;
  }

  // Return defaults if no settings found
  return {
    id: 'default-platform-settings',
    platformName: process.env.PLATFORM_NAME || 'Azaire Fleet Manager',
    platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://azaire.com',
    platformLogo: null,
    logoText: null,
    primaryColor: '#3b82f6',
    platformAddress: null,
    platformEmail: null,
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Africa/Harare',
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    defaultDateFormat: 'YYYY-MM-DD',
    allowSignups: true,
    requireEmailVerification: true,
    requireAdminApproval: false,
    enableTrials: true,
    trialDuration: 30,
    requirePaymentUpfront: true,
    failedLoginAttempts: 5,
    emailNotifications: true,
    smsNotifications: false,
    webhookUrl: null,
    alertFrequency: 'immediate',
    maintenanceMode: false,
    invoicePrefix: 'INV',
    invoiceFooter: null,
    taxNumber: null,
    bankDetails: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

/**
 * Check if maintenance mode is enabled
 */
export const isMaintenanceMode = cache(async (): Promise<boolean> => {
  const settings = await getPlatformSettings();
  return settings?.maintenanceMode ?? false;
});


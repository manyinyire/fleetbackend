-- CreateTable: PlatformSettings
CREATE TABLE IF NOT EXISTS "platform_settings" (
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

-- Insert default platform settings
INSERT INTO "platform_settings" (
    "id",
    "platformName",
    "platformUrl",
    "defaultTimezone",
    "defaultCurrency",
    "allowSignups",
    "requireEmailVerification",
    "requireAdminApproval",
    "enableTrials",
    "trialDuration",
    "requirePaymentUpfront",
    "failedLoginAttempts",
    "emailNotifications",
    "smsNotifications",
    "webhookUrl",
    "alertFrequency",
    "maintenanceMode",
    "createdAt",
    "updatedAt"
) VALUES (
    'default-platform-settings',
    'Azaire Fleet Manager',
    COALESCE(NULLIF(current_setting('app.platform_url', true), ''), 'https://azaire.com'),
    'Africa/Harare',
    'USD',
    true,
    true,
    false,
    true,
    30,
    true,
    5,
    true,
    false,
    NULL,
    'immediate',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;


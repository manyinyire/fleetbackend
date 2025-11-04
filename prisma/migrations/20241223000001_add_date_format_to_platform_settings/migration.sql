-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "defaultDateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD';


-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "invoicePrefix" TEXT NOT NULL DEFAULT 'INV';
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "invoiceFooter" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "taxNumber" TEXT;
ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "bankDetails" TEXT;


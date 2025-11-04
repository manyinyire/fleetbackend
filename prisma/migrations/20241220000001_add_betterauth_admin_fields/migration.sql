-- AlterTable: Change role from enum to string
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

-- AlterTable: Add BetterAuth Admin plugin fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP(3);

-- AlterTable: Add impersonatedBy field to sessions
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;


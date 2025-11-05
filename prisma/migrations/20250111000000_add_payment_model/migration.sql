-- CreateEnum (check if exists first)
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable (check if exists first)
DO $$ BEGIN
    CREATE TABLE "payments" (
        "id" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "invoiceId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "paymentMethod" TEXT NOT NULL DEFAULT 'paynow',
        "paynowReference" TEXT,
        "pollUrl" TEXT,
        "redirectUrl" TEXT,
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "verifiedAt" TIMESTAMP(3),
        "verificationHash" TEXT,
        "paymentMetadata" JSONB,
        "errorMessage" TEXT,
        "upgradeActioned" BOOLEAN NOT NULL DEFAULT false,
        "unsuspendActioned" BOOLEAN NOT NULL DEFAULT false,
        "emailSent" BOOLEAN NOT NULL DEFAULT false,
        "adminNotified" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "payments_paynowReference_key" UNIQUE ("paynowReference")
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (with IF NOT EXISTS check)
CREATE INDEX IF NOT EXISTS "payments_tenantId_idx" ON "payments"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_paynowReference_idx" ON "payments"("paynowReference");

-- AddForeignKey (with IF NOT EXISTS check)
DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

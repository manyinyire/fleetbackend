-- AlterTable: Add new fields to Tenant table
ALTER TABLE "tenants" ADD COLUMN "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "tenants" ADD COLUMN "trialStartDate" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN "trialEndDate" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN "isInTrial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN "canceledAt" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN "cancelReason" TEXT;

-- CreateEnum: BillingCycle
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum: PaymentStatus
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum: SubscriptionChangeType
CREATE TYPE "SubscriptionChangeType" AS ENUM ('UPGRADE', 'DOWNGRADE', 'CYCLE_CHANGE', 'TRIAL_START', 'TRIAL_END', 'RENEWAL', 'CANCELLATION', 'REACTIVATION');

-- CreateTable: Payment
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

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SubscriptionHistory
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromPlan" "SubscriptionPlan" NOT NULL,
    "toPlan" "SubscriptionPlan" NOT NULL,
    "fromCycle" "BillingCycle",
    "toCycle" "BillingCycle",
    "changeType" "SubscriptionChangeType" NOT NULL,
    "changeReason" TEXT,
    "proratedAmount" DECIMAL(10,2),
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PlanConfiguration
CREATE TABLE "plan_configurations" (
    "id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "yearlyPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SubscriptionMetrics
CREATE TABLE "subscription_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mrr" DECIMAL(15,2) NOT NULL,
    "arr" DECIMAL(15,2) NOT NULL,
    "totalSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "activeSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "trialSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "canceledSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "freeCount" INTEGER NOT NULL DEFAULT 0,
    "basicCount" INTEGER NOT NULL DEFAULT 0,
    "premiumCount" INTEGER NOT NULL DEFAULT 0,
    "churnedCount" INTEGER NOT NULL DEFAULT 0,
    "churnRate" DECIMAL(5,2) NOT NULL,
    "trialToBasic" INTEGER NOT NULL DEFAULT 0,
    "trialToPremium" INTEGER NOT NULL DEFAULT 0,
    "basicToPremium" INTEGER NOT NULL DEFAULT 0,
    "newRevenue" DECIMAL(15,2) NOT NULL,
    "churnedRevenue" DECIMAL(15,2) NOT NULL,
    "expansionRevenue" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_paynowReference_key" ON "payments"("paynowReference");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "payments"("tenantId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_paynowReference_idx" ON "payments"("paynowReference");

-- CreateIndex
CREATE INDEX "subscription_history_tenantId_idx" ON "subscription_history"("tenantId");

-- CreateIndex
CREATE INDEX "subscription_history_effectiveDate_idx" ON "subscription_history"("effectiveDate");

-- CreateIndex
CREATE INDEX "subscription_history_changeType_idx" ON "subscription_history"("changeType");

-- CreateIndex
CREATE UNIQUE INDEX "plan_configurations_plan_key" ON "plan_configurations"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_metrics_date_key" ON "subscription_metrics"("date");

-- CreateIndex
CREATE INDEX "subscription_metrics_date_idx" ON "subscription_metrics"("date");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

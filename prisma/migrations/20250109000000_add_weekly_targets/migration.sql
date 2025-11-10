-- CreateTable
CREATE TABLE "weekly_targets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "baseTarget" DECIMAL(10,2) NOT NULL,
    "carriedDebt" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalTarget" DECIMAL(10,2) NOT NULL,
    "totalRemitted" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shortfall" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weekly_targets_tenantId_idx" ON "weekly_targets"("tenantId");

-- CreateIndex
CREATE INDEX "weekly_targets_driverId_idx" ON "weekly_targets"("driverId");

-- CreateIndex
CREATE INDEX "weekly_targets_vehicleId_idx" ON "weekly_targets"("vehicleId");

-- CreateIndex
CREATE INDEX "weekly_targets_weekStart_idx" ON "weekly_targets"("weekStart");

-- CreateIndex
CREATE INDEX "weekly_targets_status_idx" ON "weekly_targets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_targets_driverId_weekStart_key" ON "weekly_targets"("driverId", "weekStart");

-- AddForeignKey
ALTER TABLE "weekly_targets" ADD CONSTRAINT "weekly_targets_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_targets" ADD CONSTRAINT "weekly_targets_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

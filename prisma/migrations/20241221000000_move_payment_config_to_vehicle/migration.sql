-- Add payment configuration fields to vehicles table
ALTER TABLE vehicles 
ADD COLUMN "paymentModel" "PaymentModel" NOT NULL DEFAULT 'DRIVER_REMITS',
ADD COLUMN "paymentConfig" JSONB NOT NULL DEFAULT '{}';

-- Migrate existing payment config from drivers to vehicles
-- This assumes each driver-vehicle assignment should use the driver's payment config
UPDATE vehicles v
SET 
  "paymentModel" = d."paymentModel",
  "paymentConfig" = d."paymentConfig"
FROM driver_vehicle_assignments dva
JOIN drivers d ON d.id = dva."driverId"
WHERE v.id = dva."vehicleId"
  AND dva."isPrimary" = true
  AND dva."endDate" IS NULL;

-- For vehicles without assignments, set default
UPDATE vehicles
SET 
  "paymentModel" = 'DRIVER_REMITS',
  "paymentConfig" = '{"amount": 100, "frequency": "DAILY"}'::jsonb
WHERE "paymentModel" IS NULL;

-- Remove payment configuration from drivers table
ALTER TABLE drivers
DROP COLUMN "paymentModel",
DROP COLUMN "paymentConfig";

-- Note: debtBalance remains on Driver as it's driver-specific


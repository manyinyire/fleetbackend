-- Add target amount and target reached fields to remittances table
ALTER TABLE remittances 
ADD COLUMN "targetAmount" DECIMAL(10, 2),
ADD COLUMN "targetReached" BOOLEAN NOT NULL DEFAULT false;

-- Create index on targetReached for efficient querying
CREATE INDEX IF NOT EXISTS "remittances_targetReached_idx" ON remittances("targetReached");

-- Update existing remittances: calculate targetAmount and targetReached for DRIVER_REMITS vehicles
UPDATE remittances r
SET 
  "targetAmount" = CASE 
    WHEN v."paymentModel" = 'DRIVER_REMITS' AND (v."paymentConfig"->>'amount') IS NOT NULL 
    THEN CAST(v."paymentConfig"->>'amount' AS DECIMAL(10, 2))
    ELSE NULL
  END,
  "targetReached" = CASE
    WHEN v."paymentModel" = 'DRIVER_REMITS' AND (v."paymentConfig"->>'amount') IS NOT NULL 
    THEN r.amount >= CAST(v."paymentConfig"->>'amount' AS DECIMAL(10, 2))
    ELSE false
  END
FROM vehicles v
WHERE r."vehicleId" = v.id;


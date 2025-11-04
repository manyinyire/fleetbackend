# Migration: Payment Configuration from Driver to Vehicle

## Overview
Payment configuration has been moved from the Driver model to the Vehicle model. When a driver is assigned to a vehicle, they inherit the payment configuration from that vehicle.

## Database Migration Required

Run the following SQL migration:

```sql
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
```

## Code Changes Summary

### Schema Changes
- ✅ Added `paymentModel` and `paymentConfig` to Vehicle model
- ✅ Removed `paymentModel` and `paymentConfig` from Driver model
- ✅ Kept `debtBalance` on Driver (driver-specific)

### Component Changes
- ✅ Updated `vehicle-form.tsx` - Added payment configuration section
- ⏳ Update `vehicle-edit-form.tsx` - Add payment configuration section
- ⏳ Update `driver-form.tsx` - Remove payment configuration section
- ⏳ Update `driver-edit-form.tsx` - Remove payment configuration section

### Server Actions
- ✅ Updated `vehicles.ts` - Handles payment config
- ⏳ Update `drivers.ts` - Remove payment config handling

## Next Steps
1. Apply the database migration
2. Complete remaining component updates
3. Test vehicle-driver assignment flow
4. Update any queries that reference driver.paymentModel to use vehicle.paymentModel


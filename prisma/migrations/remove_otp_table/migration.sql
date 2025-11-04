-- Remove OTP table and enum (BetterAuth handles OTP internally)
-- This migration drops the custom OTP table since we're using BetterAuth's Email OTP plugin

-- Drop the OTP table
DROP TABLE IF EXISTS "otps" CASCADE;

-- Drop the OTPType enum (if it exists and isn't used elsewhere)
-- Note: Check if OTPType is used elsewhere before dropping
-- DROP TYPE IF EXISTS "OTPType";


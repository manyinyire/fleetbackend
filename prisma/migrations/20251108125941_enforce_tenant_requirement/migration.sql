-- Add check constraint to enforce that all users except SUPER_ADMIN must have a tenantId
-- This prevents the data integrity issue where users exist without tenants

-- First, let's identify any users that violate this constraint
-- We'll log them but not fail the migration
DO $$
DECLARE
    invalid_users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_users_count
    FROM users
    WHERE role != 'SUPER_ADMIN'
      AND "tenantId" IS NULL;

    IF invalid_users_count > 0 THEN
        RAISE WARNING 'Found % user(s) without tenantId that are not SUPER_ADMIN. These need to be fixed before applying constraint.', invalid_users_count;
        RAISE NOTICE 'Run the fix script: npx tsx scripts/fix-user-j.ts';
        RAISE EXCEPTION 'Cannot apply constraint: % users without tenantId found. Fix them first.', invalid_users_count;
    END IF;
END $$;

-- Add the check constraint
-- This ensures that if a user is not SUPER_ADMIN, they MUST have a tenantId
ALTER TABLE users
ADD CONSTRAINT users_tenant_requirement_check
CHECK (
    role = 'SUPER_ADMIN' OR "tenantId" IS NOT NULL
);

-- Add a comment to document why this constraint exists
COMMENT ON CONSTRAINT users_tenant_requirement_check ON users IS
'Enforces that all users except SUPER_ADMIN must have a tenantId. This is a critical business rule for the multi-tenant architecture.';

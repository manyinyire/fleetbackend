-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- This migration adds database-level security to ensure tenant isolation
-- Works in conjunction with Prisma tenant extension for defense-in-depth

-- Enable Row Level Security on all tenant-scoped tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS tenant_isolation_policy ON vehicles;
DROP POLICY IF EXISTS tenant_isolation_policy ON drivers;
DROP POLICY IF EXISTS tenant_isolation_policy ON driver_vehicle_assignments;
DROP POLICY IF EXISTS tenant_isolation_policy ON remittances;
DROP POLICY IF EXISTS tenant_isolation_policy ON maintenance_records;
DROP POLICY IF EXISTS tenant_isolation_policy ON contracts;
DROP POLICY IF EXISTS tenant_isolation_policy ON expenses;
DROP POLICY IF EXISTS tenant_isolation_policy ON incomes;
DROP POLICY IF EXISTS tenant_isolation_policy ON tenant_settings;
DROP POLICY IF EXISTS tenant_isolation_policy ON audit_logs;
DROP POLICY IF EXISTS tenant_isolation_policy ON invoices;
DROP POLICY IF EXISTS tenant_isolation_policy ON invoice_reminders;
DROP POLICY IF EXISTS tenant_isolation_policy ON payments;

-- Create RLS policies for each tenant-scoped table
-- Policy allows access only to rows matching the current tenant OR if user is super admin

-- VEHICLES
CREATE POLICY tenant_isolation_policy ON vehicles
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- DRIVERS
CREATE POLICY tenant_isolation_policy ON drivers
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- DRIVER_VEHICLE_ASSIGNMENTS
CREATE POLICY tenant_isolation_policy ON driver_vehicle_assignments
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- REMITTANCES
CREATE POLICY tenant_isolation_policy ON remittances
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- MAINTENANCE_RECORDS
CREATE POLICY tenant_isolation_policy ON maintenance_records
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- CONTRACTS
CREATE POLICY tenant_isolation_policy ON contracts
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- EXPENSES
CREATE POLICY tenant_isolation_policy ON expenses
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- INCOMES
CREATE POLICY tenant_isolation_policy ON incomes
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- TENANT_SETTINGS
CREATE POLICY tenant_isolation_policy ON tenant_settings
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- AUDIT_LOGS
-- Audit logs can be tenant-scoped OR system-wide (tenantId = NULL)
CREATE POLICY tenant_isolation_policy ON audit_logs
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
        OR "tenantId" IS NULL -- Allow access to system-wide logs for super admins
    );

-- INVOICES
CREATE POLICY tenant_isolation_policy ON invoices
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- INVOICE_REMINDERS
CREATE POLICY tenant_isolation_policy ON invoice_reminders
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- PAYMENTS
CREATE POLICY tenant_isolation_policy ON payments
    FOR ALL
    USING (
        "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        OR current_setting('app.is_super_admin', true) = 'true'
    );

-- ============================================
-- NOTES ON RLS IMPLEMENTATION
-- ============================================
--
-- Session Variables:
--   - app.current_tenant_id: Set via setTenantContext() in src/lib/tenant.ts
--   - app.is_super_admin: Set to 'true' for SUPER_ADMIN users
--
-- Policy Logic:
--   - Normal users: Can only access rows where tenantId matches session variable
--   - Super admins: Can access all rows regardless of tenantId
--
-- Defense in Depth:
--   - Layer 1: Prisma Extension (src/lib/prisma-tenant-extension.ts)
--   - Layer 2: RLS Policies (this migration)
--
-- Testing RLS:
--   1. Connect to database as application user
--   2. Set session variable: SELECT set_config('app.current_tenant_id', 'tenant-id', false);
--   3. Query tenant-scoped table: SELECT * FROM vehicles;
--   4. Should only return rows for that tenant
--

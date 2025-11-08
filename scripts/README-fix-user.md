# Fix User Without Tenant

## Problem

In the fleet management system, **every user MUST have a `tenantId`** except for `SUPER_ADMIN` users. If a user exists without a tenantId, they will be unable to log in and access the dashboard.

## Symptoms

When a user without a tenantId tries to log in:
1. Authentication succeeds
2. They are redirected to `/auth/error?type=no_tenant`
3. They cannot access the dashboard

## Root Cause

This is a **data integrity issue** that can occur when:
- A user is created manually in the database without a tenant
- A tenant is deleted but user references remain
- An error occurs during the signup process that creates the user but fails to create/assign the tenant

## Solution Scripts

### 1. Investigate User

Run this to find users without tenants:

```bash
npx tsx scripts/investigate-user-j.ts
```

This will:
- Find all users matching 'j' (or modify the script to search for other users)
- Show which users don't have a tenantId
- Suggest potential tenants they could be assigned to
- Provide recommendations

### 2. Fix User

Run this interactive script to fix a user:

```bash
npx tsx scripts/fix-user-j.ts
```

This provides three options:

**Option 1: Make the user a SUPER_ADMIN**
- Use this if the user should be a system administrator
- SUPER_ADMIN users don't need a tenant
- They will access `/superadmin/dashboard` after login

**Option 2: Create a new tenant for the user**
- Creates a new organization/tenant
- Assigns the user as TENANT_ADMIN
- User will access `/dashboard` after login

**Option 3: Assign to an existing tenant**
- Links the user to an existing organization
- Useful if the user should belong to an existing tenant
- User will access `/dashboard` after login

## Prevention

The system has been updated to prevent this issue:

1. **Signup Flow**: Always creates a tenant before creating a user
2. **Auth Helpers**: Redirect users without tenants to an error page
3. **Error Page**: Shows clear message that admin intervention is required

## Manual Database Fix

If you prefer to fix directly in the database:

### Make user a SUPER_ADMIN:
```sql
UPDATE users
SET role = 'SUPER_ADMIN'
WHERE email = 'j';
```

### Assign to existing tenant:
```sql
UPDATE users
SET "tenantId" = 'tenant-id-here', role = 'TENANT_ADMIN'
WHERE email = 'j';
```

### Create tenant and assign:
```sql
-- First create tenant
INSERT INTO tenants (id, name, slug, email, phone, plan, status)
VALUES (gen_random_uuid(), 'Company Name', 'company-slug', 'user@email.com', '+263771234567', 'FREE', 'ACTIVE')
RETURNING id;

-- Then assign to user
UPDATE users
SET "tenantId" = 'new-tenant-id-from-above', role = 'TENANT_ADMIN'
WHERE email = 'j';

-- Create tenant settings
INSERT INTO "TenantSettings" ("tenantId", "companyName", email, phone)
VALUES ('new-tenant-id-from-above', 'Company Name', 'user@email.com', '+263771234567');
```

## Verification

After fixing, the user should be able to:
1. Log in successfully
2. Be redirected to the appropriate dashboard:
   - SUPER_ADMIN → `/superadmin/dashboard`
   - Regular users → `/dashboard`
3. Access all features without errors

## Need Help?

If the scripts don't work or you need assistance, check:
1. Database connection is working
2. Prisma client is generated (`npm run db:generate`)
3. User actually exists in the database
4. No other validation errors preventing access

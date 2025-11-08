# Tenant Requirement: Critical Business Rule

## Overview

This system enforces a **critical business rule**:

**Every user MUST have a `tenantId` except for `SUPER_ADMIN` users.**

This is enforced at multiple levels to ensure data integrity and prevent system failures.

## Architecture

### Multi-Tenant Design

- **Tenant**: An organization using the fleet management system
- **User**: An individual who belongs to a tenant
- **SUPER_ADMIN**: System administrators who manage the entire platform (no tenant)

### The Rule

```
IF user.role != 'SUPER_ADMIN' THEN user.tenantId MUST NOT BE NULL
```

## Enforcement Layers

### 1. Database Level (Strongest Protection)

**File**: `prisma/migrations/20251108125941_enforce_tenant_requirement/migration.sql`

PostgreSQL CHECK constraint:
```sql
ALTER TABLE users
ADD CONSTRAINT users_tenant_requirement_check
CHECK (
    role = 'SUPER_ADMIN' OR "tenantId" IS NOT NULL
);
```

**What it does**:
- Prevents any INSERT or UPDATE that violates the rule
- Works even if application code has bugs
- Cannot be bypassed
- Returns error if violated

**Migration Behavior**:
- Will fail if existing users violate the rule
- Provides clear error message with count of violating users
- Must fix violating users before migration can proceed

### 2. Application Level: BetterAuth Hooks

**File**: `src/lib/auth.ts`

After-signup hook:
```typescript
hooks: {
  after: async (ctx) => {
    if (ctx.path === '/sign-up/email') {
      const user = ctx.context.user;
      if (user) {
        const role = (user as any).role;
        const tenantId = (user as any).tenantId;

        // Enforce tenant requirement
        if (role !== 'SUPER_ADMIN' && !tenantId) {
          // Delete the invalid user
          await prisma.user.delete({ where: { id: user.id } });

          throw new Error(
            'User creation failed: All users except SUPER_ADMIN must have a tenant assigned.'
          );
        }
      }
    }
  }
}
```

**What it does**:
- Validates every user created through BetterAuth
- Deletes invalid users immediately
- Throws clear error message
- Prevents incomplete signups

### 3. API Endpoint Validation

**File**: `src/app/api/superadmin/users/route.ts`

User creation endpoint:
```typescript
// CRITICAL VALIDATION: All users except SUPER_ADMIN must have a tenantId
const userRole = role || 'USER';
if (userRole !== 'SUPER_ADMIN' && !tenantId) {
  return NextResponse.json(
    {
      error: 'Tenant ID is required for all users except SUPER_ADMIN',
      details: 'In this system, every user must belong to a tenant organization. ' +
               'Only SUPER_ADMIN users can exist without a tenant. ' +
               'Please provide a tenantId or set role to SUPER_ADMIN.',
    },
    { status: 400 }
  );
}
```

**What it does**:
- Validates at API boundary
- Returns 400 Bad Request if violated
- Provides helpful error message
- Checks tenant existence

### 4. Runtime Validation

**File**: `src/lib/auth-helpers.ts`

`requireTenant()` function:
```typescript
// CRITICAL: Every non-SUPER_ADMIN user MUST have a tenantId
if (!(user as any).tenantId) {
  authLogger.error({
    userId: user.id,
    email: user.email,
    role: (user as any).role,
  }, 'User without tenant attempted to access tenant-required resource');

  redirect('/auth/error?type=no_tenant');
}
```

**What it does**:
- Catches any users without tenants at runtime
- Logs security violations
- Redirects to error page
- Prevents access to protected resources

## Correct User Creation Flows

### Creating a Regular User (Signup)

**File**: `src/server/actions/auth.ts`

1. Create tenant first
2. Create user with `tenantId` set
3. User can now log in

```typescript
// 1. Create tenant
const tenant = await prisma.tenant.create({
  data: { name, slug, email, phone }
});

// 2. Create user with tenant
const user = await auth.api.signUpEmail({
  body: {
    email,
    password,
    name,
    tenantId: tenant.id,  // ✅ Tenant assigned
    role: 'TENANT_ADMIN',
  },
});
```

### Creating SUPER_ADMIN

**File**: `scripts/reset-superadmin.ts`

1. Create user through BetterAuth
2. Update role to SUPER_ADMIN
3. Set tenantId to null

```typescript
// 1. Create user
const { user } = await auth.api.signUpEmail({
  body: { email, password, name }
});

// 2. Upgrade to SUPER_ADMIN
await prisma.user.update({
  where: { id: user.id },
  data: {
    role: 'SUPER_ADMIN',
    tenantId: null,  // ✅ SUPER_ADMIN doesn't need tenant
    emailVerified: true,
  },
});
```

### Creating User via Super Admin Panel

**File**: `src/app/api/superadmin/users/route.ts`

```typescript
// Validate tenant requirement
if (role !== 'SUPER_ADMIN' && !tenantId) {
  return error('Tenant ID required');
}

// Create user
const user = await prisma.user.create({
  data: {
    email,
    name,
    role,
    tenantId: tenantId || null,  // ✅ null only if SUPER_ADMIN
  },
});
```

## What Happens if Rule is Violated

### During Database Migration
```
ERROR: Cannot apply constraint: 1 users without tenantId found. Fix them first.
HINT: Run the fix script: npx tsx scripts/fix-user-j.ts
```

### During User Creation (BetterAuth Hook)
```
Error: User creation failed: All users except SUPER_ADMIN must have a tenant assigned.
This is a system requirement. Please use the proper signup flow.
```

### During API Call
```json
{
  "error": "Tenant ID is required for all users except SUPER_ADMIN",
  "details": "In this system, every user must belong to a tenant organization..."
}
```

### During Login/Access
- User redirected to `/auth/error?type=no_tenant`
- Error page explains the data integrity issue
- User must contact administrator
- Admin fixes using `npx tsx scripts/fix-user-j.ts`

## Fixing Violating Users

If users exist without tenants:

### Option 1: Interactive Script
```bash
npx tsx scripts/fix-user-j.ts
```

Choose:
1. Make SUPER_ADMIN
2. Create new tenant
3. Assign to existing tenant

### Option 2: Manual SQL
```sql
-- Make SUPER_ADMIN
UPDATE users SET role = 'SUPER_ADMIN', "tenantId" = NULL
WHERE email = 'user@example.com';

-- OR assign to tenant
UPDATE users SET "tenantId" = 'tenant-id-here', role = 'TENANT_ADMIN'
WHERE email = 'user@example.com';
```

## Testing

### Verify Constraint Exists
```sql
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'users_tenant_requirement_check';
```

### Try to Create Invalid User (Should Fail)
```typescript
// This MUST fail
await prisma.user.create({
  data: {
    email: 'test@test.com',
    name: 'Test',
    role: 'USER',
    tenantId: null,  // ❌ Violation!
  },
});
// Error: new row violates check constraint "users_tenant_requirement_check"
```

### Try to Create Valid SUPER_ADMIN (Should Succeed)
```typescript
// This MUST succeed
await prisma.user.create({
  data: {
    email: 'admin@test.com',
    name: 'Admin',
    role: 'SUPER_ADMIN',
    tenantId: null,  // ✅ Allowed for SUPER_ADMIN
  },
});
```

## Monitoring

Check for violating users periodically:

```sql
SELECT id, email, name, role, "tenantId", "createdAt"
FROM users
WHERE role != 'SUPER_ADMIN'
  AND "tenantId" IS NULL;
```

Should return **0 rows**. If any rows found, investigate immediately.

## Future Considerations

### Possible Enhancements
1. Database trigger to log all tenant requirement violations
2. Automated alerts when violations attempted
3. Audit log for all user creation attempts
4. Dashboard showing user/tenant distribution

### Important Notes
- **Never disable the check constraint** - it's protecting data integrity
- **Never skip validation** in APIs - each layer provides defense
- **Always test** user creation flows after code changes
- **Monitor logs** for attempted violations

## Summary

This multi-layered enforcement ensures:
1. ✅ Database prevents violations at lowest level
2. ✅ Application logic validates before database
3. ✅ API endpoints check at boundaries
4. ✅ Runtime checks catch any edge cases
5. ✅ Clear error messages guide developers
6. ✅ Fix scripts available for edge cases

**Result**: It is virtually impossible to create a user without a tenant unless they're SUPER_ADMIN.

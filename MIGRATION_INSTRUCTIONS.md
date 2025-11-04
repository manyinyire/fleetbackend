# Migration Instructions: Add PlatformSettings

## Overview
This migration adds a `PlatformSettings` model to store platform-wide configuration settings in the database instead of using environment variables.

## Step 1: Generate Migration

Run the following command to create the migration:

```bash
npx prisma migrate dev --name add_platform_settings
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Generate the updated Prisma Client

## Step 2: Seed Default Settings (Optional)

If you want to seed default platform settings, you can run:

```bash
npx ts-node prisma/migrations/add_platform_settings.ts
```

Or manually insert default settings:

```sql
INSERT INTO "platform_settings" (
    "id",
    "platformName",
    "platformUrl",
    "defaultTimezone",
    "defaultCurrency",
    "allowSignups",
    "requireEmailVerification",
    "requireAdminApproval",
    "enableTrials",
    "trialDuration",
    "requirePaymentUpfront",
    "failedLoginAttempts",
    "emailNotifications",
    "smsNotifications",
    "webhookUrl",
    "alertFrequency",
    "maintenanceMode"
) VALUES (
    'default-platform-settings',
    'Azaire Fleet Manager',
    'https://azaire.com',
    'Africa/Harare',
    'USD',
    true,
    true,
    false,
    true,
    30,
    true,
    5,
    true,
    false,
    NULL,
    'immediate',
    false
) ON CONFLICT DO NOTHING;
```

## Step 3: Verify Migration

After running the migration:

1. **Check Prisma Client generation:**
   ```bash
   npx prisma generate
   ```

2. **Verify schema is valid:**
   ```bash
   npx prisma validate
   ```

3. **Check database:**
   ```bash
   npx prisma studio
   ```
   Navigate to `platform_settings` table to verify it was created.

## What Changed

### New Model: `PlatformSettings`

Stores platform-wide configuration:

- **platformName**: Name of the platform
- **platformUrl**: Main URL for the platform
- **defaultTimezone**: Default timezone for all tenants
- **defaultCurrency**: Default currency
- **allowSignups**: Whether new signups are allowed
- **requireEmailVerification**: Require email verification
- **requireAdminApproval**: Require admin approval for signups
- **enableTrials**: Enable trial periods
- **trialDuration**: Trial duration in days
- **requirePaymentUpfront**: Require payment before access
- **failedLoginAttempts**: Max failed login attempts before lockout
- **emailNotifications**: Enable email notifications
- **smsNotifications**: Enable SMS notifications
- **webhookUrl**: Webhook URL for alerts
- **alertFrequency**: Alert frequency (immediate/hourly/daily)
- **maintenanceMode**: Enable maintenance mode

### Updated API

The settings API (`/api/superadmin/settings`) now:
- Reads platform settings from database
- Creates default settings if none exist
- Updates platform settings when changed
- Still handles admin-specific settings separately

## Rollback (if needed)

If you need to rollback this migration:

```bash
npx prisma migrate reset
```

**Warning:** This will reset your entire database. Use with caution in production.

## Production Deployment

For production deployments:

1. **Generate migration SQL:**
   ```bash
   npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script > migration.sql
   ```

2. **Review the SQL** before applying

3. **Apply migration:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed default settings** (if not already present)

## Notes

- The migration automatically creates default settings if none exist when the API is first called
- Platform settings are separate from admin-specific settings (stored in `AdminSettings`)
- Environment variables are still used as fallbacks during initial setup
- All settings updates are logged in the audit log


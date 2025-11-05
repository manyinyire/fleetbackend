# Platform Settings Usage Guide

## Current Status

The platform settings (Platform Name, Platform URL, Platform Address, Platform Email, Maintenance Mode) are **currently being saved to the database** but **NOT being used anywhere in the application**.

## Where They Should Be Used

### 1. **Platform Name** (`platformName`)
Currently hardcoded as "Azaire Fleet Manager" in:
- `src/app/layout.tsx` - Page titles and metadata
- `src/components/Layouts/header/index.tsx` - Header display (currently uses tenant company name)
- Email templates - Subject lines and headers
- Invoice PDFs - Header/footer
- Landing page - Branding

**To Fix:** Use `getPlatformSettingsWithDefaults()` from `src/lib/platform-settings.ts`

### 2. **Platform URL** (`platformUrl`)
Currently not used anywhere. Should be used in:
- Email links (password reset, email verification)
- Social media sharing links
- Invoice PDFs - "Visit us at" links
- Email signatures
- OAuth redirects

**To Fix:** Use `getPlatformSettingsWithDefaults()` from `src/lib/platform-settings.ts`

### 3. **Platform Address** (`platformAddress`)
Currently not used anywhere. Should be used in:
- Invoice PDFs - Company address
- Email footers - Contact information
- Contact page (if exists)
- Legal pages (Terms, Privacy Policy)

**To Fix:** Use `getPlatformSettingsWithDefaults()` from `src/lib/platform-settings.ts`

### 4. **Platform Email** (`platformEmail`)
Currently not used anywhere. Should be used in:
- Email "From" address (if not already set)
- Email signatures - "Contact us at"
- Invoice PDFs - Support email
- Contact page - Default email
- Error pages - Support contact

**To Fix:** Use `getPlatformSettingsWithDefaults()` from `src/lib/platform-settings.ts`

### 5. **Maintenance Mode** (`maintenanceMode`)
✅ **NOW IMPLEMENTED** in middleware (`src/middleware.ts`)
- Redirects non-super-admin users to `/maintenance` page
- Super admins can still access the platform

**Still Needed:** Create `/maintenance` page to display maintenance message

## Implementation Examples

### Example 1: Update Layout Metadata
```typescript
// src/app/layout.tsx
import { getPlatformSettingsWithDefaults } from '@/lib/platform-settings';

export async function generateMetadata() {
  const settings = await getPlatformSettingsWithDefaults();
  
  return {
    title: {
      template: `%s | ${settings.platformName}`,
      default: settings.platformName,
    },
    // ...
  };
}
```

### Example 2: Use in Email Templates
```typescript
// In your email sending code
import { getPlatformSettingsWithDefaults } from '@/lib/platform-settings';

const settings = await getPlatformSettingsWithDefaults();

const emailHtml = `
  <html>
    <body>
      <h1>${settings.platformName}</h1>
      <p>Visit us at: <a href="${settings.platformUrl}">${settings.platformUrl}</a></p>
      <p>Contact: ${settings.platformEmail}</p>
      <p>Address: ${settings.platformAddress}</p>
    </body>
  </html>
`;
```

### Example 3: Use in Invoice PDFs
```typescript
// In invoice generation code
import { getPlatformSettingsWithDefaults } from '@/lib/platform-settings';

const settings = await getPlatformSettingsWithDefaults();

// Add to invoice header/footer
invoiceData.platformName = settings.platformName;
invoiceData.platformAddress = settings.platformAddress;
invoiceData.platformEmail = settings.platformEmail;
invoiceData.platformUrl = settings.platformUrl;
```

## Files That Need Updates

1. **src/app/layout.tsx** - Use platform name in metadata
2. **src/components/Layouts/header/index.tsx** - Optionally show platform name
3. **Email templates** - Use platform name, URL, address, email
4. **Invoice generation** - Use platform settings
5. **Landing page** - Use platform name and branding
6. **Create `/maintenance` page** - Display maintenance message

## Utility Functions Available

Created in `src/lib/platform-settings.ts`:

- `getPlatformSettings()` - Get settings or null
- `getPlatformSettingsWithDefaults()` - Get settings with defaults
- `isMaintenanceMode()` - Check if maintenance mode is enabled

## Next Steps

1. ✅ Created utility functions to fetch platform settings
2. ✅ Implemented maintenance mode check in middleware
3. ⏳ Update layout.tsx to use platform name
4. ⏳ Create maintenance page
5. ⏳ Update email templates
6. ⏳ Update invoice generation
7. ⏳ Update landing page


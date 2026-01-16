# Email Template System - Implementation Guide

## Overview

The email template system has been migrated from hardcoded templates to a database-driven solution that allows super admins to manage email templates through the admin interface.

## What's Been Completed

### 1. ✅ Database Schema
The `EmailTemplate` model already exists in Prisma schema with:
- `id`, `name`, `type`, `subject`, `body`
- `variables` (JSON) - stores template variable definitions
- `isActive` - toggle templates on/off
- `createdAt`, `updatedAt`

**Email Types Available:**
- `WELCOME` - Welcome emails
- `PASSWORD_RESET` - Password reset emails
- `INVOICE_NOTIFICATION` - Invoice and payment emails
- `SUBSCRIPTION_RENEWAL` - Subscription renewals
- `PAYMENT_FAILED` - Failed payment notifications
- `TRIAL_EXPIRING` - Trial expiration warnings
- `ACCOUNT_SUSPENDED` - Account suspension notices
- `ADMIN_NOTIFICATION` - Admin notifications

### 2. ✅ Seed Script Created
**File:** `scripts/seed-email-templates.ts`

**Templates Included:**
1. Email Verification
2. Password Reset
3. Invoice Notification
4. Payment Confirmation
5. Account Suspended
6. Admin New Registration

**To Run:**
```bash
npx tsx scripts/seed-email-templates.ts
```

This will populate the database with professional, responsive email templates using the `{{variable}}` syntax.

### 3. ✅ Email Template Service
**File:** `src/lib/email-template-service.ts`

**Methods:**
- `getTemplate(type, name?)` - Fetch template from database
- `renderTemplate(body, variables)` - Replace {{variables}} with actual values
- `getRenderedEmail(type, variables, name?)` - Get fully rendered email
- `listTemplates(filters?)` - List all templates
- `upsertTemplate(data)` - Create or update template
- `deleteTemplate(id)` - Delete template
- `toggleTemplateStatus(id, isActive)` - Enable/disable template

### 4. ✅ Updated Email Service
**File:** `src/lib/email.ts`

**New Method Added:**
```typescript
async sendTemplatedEmail(
  to: string | string[],
  templateType: EmailType,
  variables: Record<string, any>,
  templateName?: string
): Promise<boolean>
```

**Usage Example:**
```typescript
import { emailService } from '@/lib/email';
import { EmailType } from '@prisma/client';

// Send email using database template
await emailService.sendTemplatedEmail(
  'user@example.com',
  EmailType.WELCOME,
  {
    userName: 'John Doe',
    verificationUrl: 'https://app.com/verify?token=abc123'
  }
);
```

## Next Steps (To Complete)

### 5. Create API Endpoints
**File to create:** `src/app/api/superadmin/email-templates/route.ts`

**Endpoints needed:**
- `GET /api/superadmin/email-templates` - List all templates
- `POST /api/superadmin/email-templates` - Create/update template
- `DELETE /api/superadmin/email-templates?id=xxx` - Delete template
- `PUT /api/superadmin/email-templates/seed` - Re-seed templates

### 6. Build Super Admin UI
**File:** `src/app/superadmin/email-templates/page.tsx`

**Features needed:**
- List all templates with search/filter
- Rich text editor for template body (with HTML support)
- Variable picker/helper showing available variables
- Preview functionality
- Toggle active/inactive status
- Create new templates
- Edit existing templates
- Delete templates
- Test email sending

### 7. Update Existing Email Functions
Replace hardcoded templates in `src/lib/email.ts`:

**Current functions to update:**
- `sendVerificationEmail()` → Use `EmailType.WELCOME`
- `sendInvoiceEmail()` → Use `EmailType.INVOICE_NOTIFICATION`
- `sendPasswordResetEmail()` → Use `EmailType.PASSWORD_RESET`
- etc.

**Migration approach:**
```typescript
// OLD (hardcoded)
async sendVerificationEmail(email: string, token: string, userName: string) {
  const html = `<html>...</html>`; // Hardcoded
  return this.sendEmail({ to: email, subject: '...', html });
}

// NEW (database-driven)
async sendVerificationEmail(email: string, token: string, userName: string) {
  const { appConfig } = await import('@/config/app');
  return this.sendTemplatedEmail(
    email,
    EmailType.WELCOME,
    {
      userName,
      verificationUrl: `${appConfig.baseUrl}/api/auth/verify-email?token=${token}`
    },
    'Email Verification' // Optional: specific template name
  );
}
```

## Template Variable Syntax

Templates use `{{variableName}}` syntax:

**Example Template:**
```html
<h2>Hi {{userName}}!</h2>
<p>Your invoice {{invoiceNumber}} for ${{amount}} is due on {{dueDate}}.</p>
<a href="{{paymentUrl}}">Pay Now</a>
```

**Rendering:**
```typescript
const variables = {
  userName: 'John Doe',
  invoiceNumber: 'INV-001',
  amount: '99.99',
  dueDate: '2026-02-01',
  paymentUrl: 'https://app.com/pay/inv-001'
};

const rendered = emailTemplateService.renderTemplate(templateBody, variables);
```

## Benefits

### For Super Admins:
✅ Edit email content without code changes
✅ Update branding and messaging instantly
✅ A/B test different email versions
✅ Maintain consistency across all emails
✅ Preview before sending

### For Developers:
✅ No more hardcoded HTML in code
✅ Easy to add new email types
✅ Centralized template management
✅ Version control through database
✅ Reusable template components

## Testing

### 1. Seed Templates
```bash
npx tsx scripts/seed-email-templates.ts
```

### 2. Test Template Rendering
```typescript
import { emailTemplateService } from '@/lib/email-template-service';
import { EmailType } from '@prisma/client';

const rendered = await emailTemplateService.getRenderedEmail(
  EmailType.WELCOME,
  {
    userName: 'Test User',
    verificationUrl: 'https://example.com/verify'
  }
);

console.log(rendered?.subject);
console.log(rendered?.html);
```

### 3. Test Email Sending
```typescript
import { emailService } from '@/lib/email';
import { EmailType } from '@prisma/client';

await emailService.sendTemplatedEmail(
  'test@example.com',
  EmailType.WELCOME,
  {
    userName: 'Test User',
    verificationUrl: 'https://example.com/verify'
  }
);
```

## Security Considerations

1. **Access Control:** Only super admins can edit templates
2. **XSS Prevention:** Sanitize user input in variables
3. **Template Validation:** Validate HTML structure before saving
4. **Variable Validation:** Ensure all required variables are provided
5. **Audit Logging:** Track template changes

## Future Enhancements

- [ ] Template versioning and rollback
- [ ] Multi-language support
- [ ] Template categories and tags
- [ ] Email analytics (open rates, click rates)
- [ ] Template marketplace/library
- [ ] Drag-and-drop email builder
- [ ] Template inheritance/components
- [ ] Scheduled template updates

## Files Created/Modified

### Created:
- ✅ `scripts/seed-email-templates.ts`
- ✅ `src/lib/email-template-service.ts`
- ✅ `docs/EMAIL_TEMPLATE_SYSTEM.md`

### Modified:
- ✅ `src/lib/email.ts` (added `sendTemplatedEmail` method)

### To Create:
- ⏳ `src/app/api/superadmin/email-templates/route.ts`
- ⏳ `src/app/superadmin/email-templates/page.tsx`

## Quick Start Guide

1. **Seed the database:**
   ```bash
   npx tsx scripts/seed-email-templates.ts
   ```

2. **Use templates in your code:**
   ```typescript
   import { emailService } from '@/lib/email';
   import { EmailType } from '@prisma/client';
   
   await emailService.sendTemplatedEmail(
     userEmail,
     EmailType.WELCOME,
     { userName, verificationUrl }
   );
   ```

3. **Access super admin UI:**
   - Navigate to `/superadmin/email-templates`
   - Edit templates visually
   - Changes take effect immediately

## Support

For questions or issues with the email template system, contact the development team or refer to this documentation.

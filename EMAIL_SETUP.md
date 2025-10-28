# Email Integration Setup Guide

This guide will help you set up the email integration features for the Fleet Manager application.

## Features Implemented

1. **Email Verification** - Users must verify their email before logging in
2. **Invoice Generation** - Automatic invoice generation for all plans (including free)
3. **2FA via Email** - Two-factor authentication using email OTPs
4. **Automated Invoice Reminders** - 7-day advance invoice reminders

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME="Fleet Manager"

# Application URL
NEXTAUTH_URL=http://localhost:3000

# Cron Job Secret (for automated reminders)
CRON_SECRET=your-secure-random-string
```

## SMTP Setup Instructions

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the app password as `SMTP_PASS`

### Other SMTP Providers
- **SendGrid**: Use `smtp.sendgrid.net` as host
- **Mailgun**: Use `smtp.mailgun.org` as host
- **Amazon SES**: Use your region-specific endpoint

## Database Migration

Run the following commands to update your database schema:

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push
```

## API Endpoints

### Email Verification
- `POST /api/auth/verify-email` - Verify email with token
- `GET /api/auth/verify-email?token=xxx` - Verify email via URL
- `POST /api/auth/resend-verification` - Resend verification email

### Two-Factor Authentication
- `POST /api/auth/2fa/enable` - Enable 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA
- `POST /api/auth/2fa/send-otp` - Send OTP via email
- `POST /api/auth/2fa/verify-otp` - Verify OTP

### Invoice Management
- `GET /api/invoices` - List invoices
- `POST /api/invoices/generate` - Generate new invoice
- `GET /api/invoices/[id]` - Get specific invoice

### Automated Reminders
- `POST /api/cron/invoice-reminders` - Trigger invoice reminders (cron job)

## Cron Job Setup

Set up a cron job to run invoice reminders daily:

```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/invoice-reminders
```

## Usage Examples

### Email Verification Flow
1. User signs up
2. Verification email is automatically sent
3. User clicks verification link
4. Email is verified and user can login

### Invoice Generation
```typescript
// Generate free plan invoice
const { invoice, pdf } = await invoiceGenerator.createFreePlanInvoice(tenantId);

// Generate upgrade invoice
const { invoice, pdf } = await invoiceGenerator.createUpgradeInvoice(tenantId, 'BASIC');

// Generate renewal invoice
const { invoice, pdf } = await invoiceGenerator.createRenewalInvoice(tenantId, 'PREMIUM');
```

### 2FA Setup
```typescript
// Enable 2FA
const result = await otpService.enableTwoFactor(userId);

// Send OTP
await otpService.sendTwoFactorOTP(userId);

// Verify OTP
const isValid = await otpService.verifyTwoFactorOTP(code, userId);
```

## Email Templates

The system includes HTML email templates for:
- Email verification
- Password reset
- Invoice notifications
- Invoice reminders
- 2FA OTP codes

Templates are located in `/src/lib/email.ts` and can be customized as needed.

## Testing

### Test Email Verification
1. Sign up with a new account
2. Check your email for verification link
3. Click the link to verify

### Test Invoice Generation
1. Login to your account
2. Go to the invoices page
3. Click "Generate Free Invoice"
4. Check your email for the invoice

### Test 2FA
1. Enable 2FA in your account settings
2. Logout and login again
3. Check your email for the OTP code
4. Enter the code to complete login

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Check your SMTP credentials
   - Ensure 2FA is enabled for Gmail
   - Use app password instead of regular password

2. **Emails Not Sending**
   - Check SMTP configuration
   - Verify environment variables
   - Check server logs for errors

3. **Database Errors**
   - Run database migration
   - Check Prisma schema
   - Verify database connection

4. **Cron Job Not Working**
   - Check CRON_SECRET environment variable
   - Verify cron job URL
   - Check server logs

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=email:*
```

## Security Considerations

1. **SMTP Credentials**: Store securely, never commit to version control
2. **Cron Secret**: Use a strong, random string
3. **Email Verification**: Tokens expire after 24 hours
4. **OTP Codes**: Expire after 10 minutes
5. **Rate Limiting**: Consider implementing rate limiting for email sending

## Production Deployment

1. Set up proper SMTP service (SendGrid, Mailgun, etc.)
2. Configure environment variables in production
3. Set up monitoring for email delivery
4. Configure cron job for invoice reminders
5. Test all email flows in staging environment

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify environment variables
3. Test SMTP connection independently
4. Check database schema matches Prisma schema
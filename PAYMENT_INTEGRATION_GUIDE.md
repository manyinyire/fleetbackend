# PayNow Payment Integration Guide

This document describes the PayNow payment integration implemented in the Azaire Fleet Manager application.

## Overview

The payment integration allows tenants to pay for invoices using PayNow (USD only). The system includes:

- ✅ Secure payment processing with PayNow
- ✅ Full payment verification (no fake success allowed)
- ✅ Auto-upgrade on successful payment
- ✅ Auto-unsuspend suspended accounts
- ✅ Email notifications with invoice attachments
- ✅ Admin alerts for new payments
- ✅ Payment reconciliation dashboard
- ✅ Google Analytics tracking

## Environment Variables

Add the following to your `.env` file:

```env
# PayNow Payment Gateway
PAYNOW_INTEGRATION_ID="your-paynow-integration-id"
PAYNOW_INTEGRATION_KEY="your-paynow-integration-key"
PAYNOW_RESULT_URL="https://your-domain.com/api/payments/paynow/callback"
PAYNOW_RETURN_URL="https://your-domain.com/payments/result"

# Email (Resend)
RESEND_API_KEY="re_your-api-key"

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

## Database Schema

The following models were added to the Prisma schema:

### Invoice Model
- Stores invoice information
- Types: SUBSCRIPTION_UPGRADE, SUBSCRIPTION_RENEWAL, ONE_TIME
- Statuses: PENDING, PAID, OVERDUE, CANCELLED

### Payment Model
- Stores payment transactions
- Includes verification flags
- Tracks auto-actions (upgrade, unsuspend)
- Includes reconciliation fields
- Supports PayNow gateway

## Security Features

### 1. Multi-Layer Verification

Every payment goes through multiple security checks:

1. **Webhook Signature Verification**: Validates the PayNow webhook signature
2. **Server-Side Status Check**: Double-checks payment status with PayNow servers
3. **Amount Verification**: Ensures paid amount matches invoice amount
4. **Internal Hash**: Generates internal verification hash for additional security

### 2. No Action Before Confirmation

The system **NEVER** takes any action (upgrade, unsuspend) until:
- Payment status is verified with PayNow
- All security checks pass
- Payment is marked as verified in the database

### 3. Idempotency

The auto-action system includes flags to prevent duplicate actions:
- `upgradeActioned`: Prevents multiple upgrades
- `unsuspendActioned`: Prevents multiple unsuspends
- `emailSent`: Prevents duplicate emails
- `adminNotified`: Prevents duplicate admin notifications

## API Endpoints

### 1. Initiate Payment

**Endpoint**: `POST /api/payments/initiate`

**Request Body**:
```json
{
  "invoiceId": "invoice_id_here"
}
```

**Response**:
```json
{
  "success": true,
  "paymentId": "payment_id",
  "redirectUrl": "https://paynow.co.zw/...",
  "pollUrl": "https://paynow.co.zw/...",
  "analytics": {
    "invoiceNumber": "INV-000001",
    "amount": 100.00,
    "currency": "USD"
  }
}
```

### 2. Payment Callback (Webhook)

**Endpoint**: `POST /api/payments/paynow/callback`

This endpoint:
1. Receives PayNow webhook notifications
2. Verifies webhook signature
3. Double-checks payment status with PayNow
4. Updates payment and invoice records
5. Performs auto-actions
6. Sends notifications

**Security**: Never trust webhook data alone - always verify with PayNow servers

### 3. Get Invoices

**Endpoint**: `GET /api/invoices`

Returns invoices for the authenticated user or all invoices for super admins.

### 4. Create Invoice (Admin Only)

**Endpoint**: `POST /api/invoices`

**Request Body**:
```json
{
  "tenantId": "tenant_id",
  "description": "Premium Plan Upgrade",
  "amount": 99.99,
  "type": "SUBSCRIPTION_UPGRADE",
  "subscriptionPlan": "PREMIUM",
  "dueDate": "2025-12-31"
}
```

### 5. Get Payments (Admin Only)

**Endpoint**: `GET /api/admin/payments`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `status`: Filter by payment status
- `verified`: Filter by verification status (true/false)
- `reconciled`: Filter by reconciliation status (true/false)
- `tenantId`: Filter by tenant

### 6. Reconcile Payment (Admin Only)

**Endpoint**: `PATCH /api/admin/payments`

**Request Body**:
```json
{
  "paymentId": "payment_id",
  "reconciled": true,
  "reconNotes": "Verified with bank statement"
}
```

## Auto-Actions

### 1. Auto-Upgrade

When a payment is confirmed for an invoice with type `SUBSCRIPTION_UPGRADE`:
- Tenant's plan is automatically upgraded
- Action is logged in audit logs
- Google Analytics event is tracked

### 2. Auto-Unsuspend

When a payment is confirmed for a suspended tenant:
- Tenant status is changed from `SUSPENDED` to `ACTIVE`
- `suspendedAt` is set to null
- Action is logged in audit logs
- Google Analytics event is tracked

### 3. Email Notifications

#### Payment Confirmation Email
- Sent to tenant email
- Includes payment details
- Attaches invoice PDF
- Confirms account reactivation/upgrade

#### Admin Alert Email
- Sent to all super admins
- Includes payment summary
- Lists all actions taken
- Provides payment reference

## Admin Dashboard

### Payments Page (`/admin/payments`)

Features:
- View all payments
- Filter by status (Paid, Pending, Failed)
- Filter by verification status
- Filter by reconciliation status
- Search by tenant, invoice, or reference
- Real-time statistics
- Payment details view

### Reconciliation Page (`/admin/reconciliation`)

Features:
- View unreconciled payments
- Reconcile payments with notes
- Track reconciliation history
- Search and filter functionality

## Google Analytics Integration

The following events are tracked:

### Payment Events
- `payment_initiated`: When a payment is started
- `purchase`: When a payment is completed (follows GA4 standards)
- `payment_failed`: When a payment fails

### Subscription Events
- `subscription_upgrade`: When a tenant upgrades their plan
- `account_unsuspended`: When an account is reactivated

### Tracking Implementation

Analytics tracking is implemented in:
- `/src/lib/gtag.ts`: Analytics functions
- `/src/components/analytics-tracker.tsx`: Page view tracking
- API endpoints: Server-side event logging

## Testing Checklist

Before going live, test:

- [ ] Payment initiation with valid invoice
- [ ] PayNow redirect works correctly
- [ ] Webhook signature verification
- [ ] Payment verification with PayNow servers
- [ ] Amount mismatch handling
- [ ] Auto-upgrade for upgrade invoices
- [ ] Auto-unsuspend for suspended accounts
- [ ] Email notifications sent correctly
- [ ] Admin alerts received
- [ ] Invoice PDF generation
- [ ] Payment reconciliation
- [ ] Google Analytics events tracked
- [ ] Failed payment handling
- [ ] Duplicate payment prevention

## Database Migration

Run the following commands to apply the schema changes:

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_payment_and_invoice_models

# Apply migration to production
npx prisma migrate deploy
```

## PayNow Configuration

1. Log in to your PayNow merchant dashboard
2. Get your Integration ID and Integration Key
3. Set up webhook URL: `https://your-domain.com/api/payments/paynow/callback`
4. Configure return URL: `https://your-domain.com/payments/result`
5. Enable USD transactions

## Security Best Practices

1. **Never trust client-side data**: Always verify payment status server-side
2. **Use HTTPS**: All PayNow webhooks require HTTPS
3. **Verify signatures**: Always validate webhook signatures
4. **Double-check amounts**: Ensure paid amount matches expected amount
5. **Log everything**: Keep detailed audit logs for reconciliation
6. **Rate limiting**: Consider adding rate limiting to payment endpoints
7. **Monitor webhooks**: Set up alerts for failed webhook verifications

## Troubleshooting

### Payment not confirmed
- Check webhook URL is correctly configured in PayNow dashboard
- Verify HTTPS is enabled on your domain
- Check server logs for webhook errors
- Ensure integration ID and key are correct

### Email not sent
- Verify Resend API key is configured
- Check email template is correct
- Review email service logs
- Ensure super admin users exist for admin alerts

### Analytics not tracking
- Verify GA_MEASUREMENT_ID is set in environment
- Check browser console for errors
- Ensure analytics tracker is loaded in layout
- Verify events are configured correctly

## Support

For PayNow-specific issues, contact PayNow support:
- Email: support@paynow.co.zw
- Documentation: https://developers.paynow.co.zw

For implementation questions, refer to:
- PayNow NodeJS SDK: https://github.com/paynow/Paynow-NodeJS-SDK
- Google Analytics 4: https://developers.google.com/analytics/devguides/collection/ga4

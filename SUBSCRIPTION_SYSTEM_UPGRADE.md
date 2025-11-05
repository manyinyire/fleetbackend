# Subscription System Upgrade - Implementation Guide

## Overview

This document details the comprehensive upgrade to the subscription system, implementing industry-standard SaaS billing practices, improved security, and advanced analytics.

## What Was Upgraded

### 1. Database Schema Enhancements

#### New Models

**Payment Model** (`payments` table)
- Proper payment tracking with PayNow integration
- Payment verification and status management
- Action tracking (upgrade, unsuspend, email, admin notification)
- Security: verification hash, payment metadata
- **Critical Fix**: Eliminates security vulnerability from callback handler

**SubscriptionHistory Model** (`subscription_history` table)
- Complete audit trail of subscription changes
- Tracks upgrades, downgrades, cancellations, renewals
- Proration tracking for mid-cycle changes
- Essential for compliance and analytics

**PlanConfiguration Model** (`plan_configurations` table)
- Centralized pricing management
- Dynamic plan features and limits
- Admin-configurable without code changes
- Supports monthly and yearly billing cycles

**SubscriptionMetrics Model** (`subscription_metrics` table)
- Daily snapshot of key metrics
- MRR, ARR, churn rate, conversion metrics
- Revenue breakdowns and growth tracking
- Historical trend analysis

#### Enhanced Tenant Model

New fields added to `tenants` table:
- `billingCycle`: MONTHLY or YEARLY
- `trialStartDate`, `trialEndDate`, `isInTrial`: Trial management
- `canceledAt`, `cancelReason`: Cancellation tracking

### 2. New Services

#### SubscriptionService (`src/services/subscription.service.ts`)

**Core Functionality:**
- Trial management (start trial, end trial, convert)
- Plan changes with prorated billing
- Cancellation and reactivation flows
- Subscription renewal automation
- Plan limit validation

**Key Methods:**
```typescript
// Start a trial
await subscriptionService.startTrial(tenantId, 30);

// Upgrade with proration
const { invoice, proration } = await subscriptionService.changePlan(
  tenantId,
  { targetPlan: 'PREMIUM', prorate: true },
  userId
);

// Cancel subscription
await subscriptionService.cancelSubscription(
  tenantId,
  { immediate: false, reason: 'Too expensive' },
  userId
);

// Renew subscription
await subscriptionService.renewSubscription(tenantId);
```

**Features:**
- Centralized pricing from config or defaults
- Prorated billing calculation
- Subscription history tracking
- Plan limit enforcement

**Default Plan Configuration:**
```typescript
FREE: {
  monthlyPrice: 0,
  yearlyPrice: 0,
  limits: { maxVehicles: 5, maxUsers: 3, maxDrivers: 10 }
}

BASIC: {
  monthlyPrice: 29.99,
  yearlyPrice: 299.90,  // ~17% discount
  limits: { maxVehicles: 25, maxUsers: 10, maxDrivers: 50 }
}

PREMIUM: {
  monthlyPrice: 99.99,
  yearlyPrice: 999.90,  // ~17% discount
  limits: { maxVehicles: -1, maxUsers: -1, maxDrivers: -1 }  // unlimited
}
```

#### SubscriptionAnalyticsService (`src/services/subscription-analytics.service.ts`)

**Metrics Calculated:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- Churn Rate
- Retention Rate
- Conversion Rates (trial→paid, basic→premium)
- Revenue by plan

**Key Methods:**
```typescript
// Get current revenue metrics
const metrics = await subscriptionAnalyticsService.getRevenueMetrics();
// Returns: { mrr, arr, arpu, ltv, revenueByPlan }

// Calculate churn
const churn = await subscriptionAnalyticsService.calculateChurnMetrics(
  startDate,
  endDate
);
// Returns: { churnRate, churnedCount, churnedRevenue, retentionRate }

// Record daily snapshot
await subscriptionAnalyticsService.recordDailyMetrics();

// Get MRR growth over time
const growth = await subscriptionAnalyticsService.getMRRGrowth(12);
```

### 3. Payment System Improvements

#### Updated Payment Callback Handler (`src/app/api/payments/paynow/callback/route.ts`)

**Security Enhancements:**
1. ✅ Webhook signature verification
2. ✅ PayNow poll URL verification (double-check with gateway)
3. ✅ Payment status verification
4. ✅ Amount validation
5. ✅ Verification hash generation
6. ✅ Idempotency (checks action flags)

**Before (Security Risk):**
```typescript
// TODO: Create Payment model
// Can't verify with PayNow
// No idempotency protection
```

**After (Secure):**
```typescript
// Find payment record
const payment = invoice.payments[0];

// Verify with PayNow
const statusCheck = await checkPaymentStatus(payment.pollUrl);

// Verify amount
if (Math.abs(paidAmount - expectedAmount) > 0.01) {
  // Reject payment
}

// Update payment with verification
await prisma.payment.update({
  where: { id: payment.id },
  data: {
    status: "PAID",
    verified: true,
    verificationHash: hash
  }
});

// Perform actions with idempotency
if (!payment.upgradeActioned) {
  // Auto-upgrade tenant
}
```

#### Updated Payment Initiate (`src/app/api/payments/initiate/route.ts`)

**Changes:**
- Creates Payment record in database
- Stores pollUrl and redirectUrl for verification
- Proper audit logging with payment ID

### 4. Invoice Generator Updates

**Integration with SubscriptionService:**
- Fetches pricing from centralized configuration
- Supports prorated billing for upgrades
- Falls back to defaults if service unavailable

**Before:**
```typescript
// Hardcoded pricing
const pricing = {
  BASIC: { monthly: 29.99 },
  PREMIUM: { monthly: 99.99 }
};
```

**After:**
```typescript
// Dynamic pricing from config
const config = await subscriptionService.getPlanConfig(plan);
const amount = config.monthlyPrice;
```

### 5. Admin Service Updates

**Updated `updateTenantPlan`:**
- Uses SubscriptionService for consistent pricing
- Marked as deprecated (use SubscriptionService.changePlan instead)
- Dynamic pricing lookup

## Migration

### Running the Migration

```bash
# Review the migration
cat prisma/migrations/20241224000000_add_subscription_system_improvements/migration.sql

# Run migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed plan configurations
npm run seed:plans
```

### Seed Plan Configurations

Create a seed script:

```typescript
// scripts/seed-plans.ts
import { subscriptionService } from '@/services/subscription.service';

async function main() {
  await subscriptionService.seedPlanConfigurations();
  console.log('Plan configurations seeded successfully');
}

main();
```

Add to package.json:
```json
{
  "scripts": {
    "seed:plans": "tsx scripts/seed-plans.ts"
  }
}
```

## Usage Examples

### 1. Start Trial for New Tenant

```typescript
import { subscriptionService } from '@/services/subscription.service';

// After tenant signup
await subscriptionService.startTrial(tenantId, 30); // 30-day trial
```

### 2. Upgrade Subscription

```typescript
// User selects Premium plan
const result = await subscriptionService.changePlan(
  tenantId,
  {
    targetPlan: 'PREMIUM',
    billingCycle: 'YEARLY',  // Optional
    prorate: true,            // Calculate prorated amount
    reason: 'User upgrade'
  },
  userId
);

// Invoice created with prorated amount
const invoice = result.invoice;
const proration = result.proration;

console.log(`Credit: $${proration.creditAmount}`);
console.log(`New charge: $${invoice.amount}`);

// Send invoice to user for payment
```

### 3. Cancel Subscription

```typescript
// Cancel at end of billing period
await subscriptionService.cancelSubscription(
  tenantId,
  {
    immediate: false,  // Keep active until period end
    reason: 'Too expensive',
    feedback: 'User feedback here'
  },
  userId
);

// Immediate cancellation
await subscriptionService.cancelSubscription(
  tenantId,
  { immediate: true, reason: 'TOS violation' },
  adminUserId
);
```

### 4. Process Renewal

```typescript
// Automated renewal (run via cron job)
const tenants = await prisma.tenant.findMany({
  where: {
    subscriptionEndDate: {
      lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    autoRenew: true
  }
});

for (const tenant of tenants) {
  try {
    const { invoice } = await subscriptionService.renewSubscription(tenant.id);
    // Send renewal invoice
  } catch (error) {
    // Handle renewal failure
  }
}
```

### 5. Validate Plan Limits

```typescript
// Before allowing user to add vehicle
const validation = await subscriptionService.validatePlanLimits(tenantId);

if (!validation.withinLimits) {
  throw new Error(`Plan limits exceeded: ${validation.violations.join(', ')}`);
}
```

### 6. Get Subscription Analytics

```typescript
// Revenue dashboard
const revenue = await subscriptionAnalyticsService.getRevenueMetrics();

console.log(`MRR: $${revenue.mrr}`);
console.log(`ARR: $${revenue.arr}`);
console.log(`ARPU: $${revenue.arpu}`);
console.log(`LTV: $${revenue.ltv}`);

// Churn analysis
const churn = await subscriptionAnalyticsService.calculateChurnMetrics(
  startDate,
  endDate
);

console.log(`Churn Rate: ${churn.churnRate}%`);
console.log(`Retention: ${churn.retentionRate}%`);

// MRR growth
const growth = await subscriptionAnalyticsService.getMRRGrowth(12);
growth.forEach(month => {
  console.log(`${month.month}: $${month.mrr}`);
});
```

### 7. Record Daily Metrics (Cron Job)

```typescript
// Run daily at midnight
import { subscriptionAnalyticsService } from '@/services/subscription-analytics.service';

async function recordDailyMetrics() {
  try {
    const metrics = await subscriptionAnalyticsService.recordDailyMetrics();
    console.log('Daily metrics recorded:', metrics);
  } catch (error) {
    console.error('Failed to record metrics:', error);
  }
}

// Schedule with cron
// 0 0 * * * node scripts/record-daily-metrics.js
```

## API Endpoints to Create

### Subscription Management

```typescript
// GET /api/tenant/subscription
// Returns current subscription details

// POST /api/tenant/subscription/upgrade
// Initiates plan upgrade

// POST /api/tenant/subscription/cancel
// Cancels subscription

// GET /api/tenant/subscription/history
// Returns subscription change history

// GET /api/plans
// Returns available plans and pricing
```

### Analytics (Super Admin)

```typescript
// GET /api/superadmin/analytics/revenue
// Returns MRR, ARR, ARPU, LTV

// GET /api/superadmin/analytics/churn?start=2024-01-01&end=2024-01-31
// Returns churn metrics

// GET /api/superadmin/analytics/conversions?start=2024-01-01&end=2024-01-31
// Returns conversion metrics

// GET /api/superadmin/analytics/mrr-growth?months=12
// Returns MRR growth over time
```

## Cron Jobs Required

### 1. Daily Metrics Recording

```bash
# crontab
0 0 * * * /path/to/node /path/to/scripts/record-daily-metrics.js
```

### 2. Subscription Renewal

```bash
# Check and process renewals daily
0 6 * * * /path/to/node /path/to/scripts/process-renewals.js
```

### 3. Trial Expiration

```bash
# Check and convert/end trials daily
0 7 * * * /path/to/node /path/to/scripts/process-trial-expirations.js
```

## Testing Checklist

- [ ] Test trial start and conversion
- [ ] Test plan upgrade with proration
- [ ] Test plan downgrade
- [ ] Test cancellation (immediate and scheduled)
- [ ] Test reactivation
- [ ] Test payment initiation and callback
- [ ] Test webhook signature verification
- [ ] Test amount validation
- [ ] Test idempotency (duplicate callbacks)
- [ ] Test subscription renewal
- [ ] Test plan limit validation
- [ ] Test analytics calculations
- [ ] Test daily metrics recording

## Benefits

### Security
✅ Proper payment verification with PayNow poll URL
✅ Webhook signature validation
✅ Amount verification
✅ Idempotency protection
✅ Verification hash generation

### Functionality
✅ Trial management
✅ Prorated billing
✅ Subscription lifecycle automation
✅ Cancellation and reactivation
✅ Plan limit enforcement
✅ Subscription history audit trail

### Analytics
✅ MRR/ARR tracking
✅ Churn rate calculation
✅ Conversion tracking
✅ Revenue attribution
✅ Growth trends
✅ LTV estimation

### Maintainability
✅ Centralized pricing configuration
✅ No more hardcoded prices
✅ Consistent pricing across system
✅ Easy to add new plans
✅ Admin-configurable without code changes

## Breaking Changes

### 1. AdminService.updateTenantPlan

**Deprecated**: Use `SubscriptionService.changePlan` instead.

**Before:**
```typescript
await adminService.updateTenantPlan(tenantId, 'PREMIUM', userId);
```

**After:**
```typescript
await subscriptionService.changePlan(
  tenantId,
  { targetPlan: 'PREMIUM' },
  userId
);
```

### 2. Payment Initiation Response

**Before:**
```json
{
  "paymentId": "invoice_id",
  "redirectUrl": "..."
}
```

**After:**
```json
{
  "paymentId": "payment_id",  // Now returns actual payment ID
  "redirectUrl": "..."
}
```

### 3. Invoice Generator

Now requires database access for pricing configuration. Ensure database connection is available when generating invoices.

## Next Steps

1. **API Implementation**: Create the subscription management API endpoints
2. **Frontend Integration**: Build subscription management UI
3. **Webhook Setup**: Configure PayNow webhook URL
4. **Cron Jobs**: Set up automated tasks for renewals and metrics
5. **Testing**: Comprehensive testing of payment flows
6. **Monitoring**: Set up alerts for failed payments, high churn, etc.
7. **Documentation**: Update user-facing documentation

## Support

For questions or issues with the subscription system, refer to:
- Payment flow: `src/app/api/payments/*/route.ts`
- Subscription logic: `src/services/subscription.service.ts`
- Analytics: `src/services/subscription-analytics.service.ts`
- Schema: `prisma/schema.prisma`

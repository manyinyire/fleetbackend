# Premium Features Implementation Guide

## Overview
This document describes the premium features implementation in the Azaire Fleet Manager application. Premium features are gated based on subscription plans (FREE, BASIC, PREMIUM).

## Table of Contents
1. [Subscription Plans](#subscription-plans)
2. [Feature Limits](#feature-limits)
3. [API Endpoints](#api-endpoints)
4. [Implementation Details](#implementation-details)
5. [Testing Premium Features](#testing-premium-features)

---

## Subscription Plans

### FREE Plan ($0/month)
**Target:** Small businesses with limited fleets
- 5 vehicles maximum
- 10 drivers maximum
- 1 admin user, 2 total users
- 3 months data retention
- Basic financial summary only
- No API access
- Email support (48-72 hours)

### BASIC Plan ($29.99/month)
**Target:** Growing businesses
- 25 vehicles maximum
- 50 drivers maximum
- 3 admin users, 10 total users
- 12 months data retention
- Advanced reporting (P&L, Cash Flow, Vehicle Profitability)
- Report export to PDF/CSV
- Read-only API access (1,000 requests/day)
- Custom email templates
- Custom branding on invoices
- Priority email support (12-24 hours)

### PREMIUM Plan ($99.99/month)
**Target:** Large enterprises
- Unlimited vehicles
- Unlimited drivers
- Unlimited users
- Unlimited data retention
- Custom reporting with advanced filters
- Scheduled reports
- Full API access (100,000+ requests/day)
- Webhook support
- SMS/WhatsApp notifications
- White-labeling
- Custom domain
- Financial forecasting
- Predictive maintenance
- 24/7 support (email, phone, chat)
- Dedicated account manager

---

## Feature Limits

### Core Resource Limits

#### Vehicles
```typescript
FREE: 5 vehicles
BASIC: 25 vehicles
PREMIUM: Unlimited
```

**Enforcement:** `/src/app/api/vehicles/route.ts` (POST)
- Checks limit before creating a new vehicle
- Returns 403 with upgrade message if limit reached

#### Drivers
```typescript
FREE: 10 drivers
BASIC: 50 drivers
PREMIUM: Unlimited
```

**Enforcement:** `/src/app/api/drivers/route.ts` (POST)
- Checks limit before creating a new driver
- Returns 403 with upgrade message if limit reached

#### Users
```typescript
FREE: 1 admin, 2 total users
BASIC: 3 admins, 10 total users
PREMIUM: Unlimited
```

**Enforcement:** `/src/app/api/superadmin/users/route.ts` (POST)
- Checks both total user limit and admin user limit
- Returns 403 with upgrade message if limit reached

### Feature Access

#### Advanced Reporting
```typescript
FREE: false (only basic summary)
BASIC: true (P&L, Cash Flow, Vehicle Profitability)
PREMIUM: true (all reports + custom reporting)
```

**Enforcement:** `/src/app/api/reports/financial/route.ts`
- FREE plan limited to `type=summary`
- BASIC+ can access all standard reports

#### Report Export
```typescript
FREE: false
BASIC: true (PDF, CSV)
PREMIUM: true (PDF, CSV, Excel)
```

**Enforcement:** `/src/app/api/reports/export/route.ts`
- Checks `reportExport` feature access

#### API Access
```typescript
FREE: false (0 requests/day)
BASIC: true (1,000 requests/day, read-only)
PREMIUM: true (100,000+ requests/day, full access)
```

**Enforcement:** `/src/middleware/api-access.ts`
- Use `withApiAccess()` wrapper on API routes
- Checks `apiAccess` feature access
- TODO: Implement actual rate limiting with Redis

---

## API Endpoints

### 1. Get Usage Summary
**Endpoint:** `GET /api/tenant/features/usage`

**Description:** Returns current usage and limits for the tenant

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": "BASIC",
    "limits": {
      "vehicles": 25,
      "drivers": 50,
      "adminUsers": 3,
      "totalUsers": 10,
      "advancedReporting": true,
      "apiAccess": true,
      "apiRequestsPerDay": 1000,
      ...
    },
    "usage": {
      "vehicles": {
        "current": 12,
        "limit": 25,
        "percentage": 48
      },
      "drivers": {
        "current": 23,
        "limit": 50,
        "percentage": 46
      },
      "users": {
        "current": 5,
        "limit": 10,
        "percentage": 50
      },
      "adminUsers": {
        "current": 2,
        "limit": 3,
        "percentage": 67
      }
    }
  }
}
```

### 2. Financial Reports
**Endpoint:** `GET /api/reports/financial?type={type}&startDate={date}&endDate={date}`

**Query Parameters:**
- `type`: Report type (`summary`, `profit-loss`, `cash-flow`, `vehicle-profitability`)
- `startDate`: Optional start date (ISO format)
- `endDate`: Optional end date (ISO format)

**Plan Restrictions:**
- FREE: Only `type=summary` allowed
- BASIC+: All report types available

**Response:**
```json
{
  "success": true,
  "reportType": "profit-loss",
  "data": {
    "totalIncome": 150000,
    "totalExpenses": 95000,
    "netProfit": 55000,
    "profitMargin": 36.67,
    ...
  }
}
```

**Error Response (403):**
```json
{
  "error": "This feature is not available on your FREE plan",
  "suggestedPlan": "BASIC",
  "upgradeMessage": "Upgrade to Basic ($29.99/month) to unlock advancedReporting and other advanced features."
}
```

### 3. Export Reports
**Endpoint:** `POST /api/reports/export`

**Body:**
```json
{
  "reportType": "profit-loss",
  "format": "pdf",
  "data": { ... }
}
```

**Plan Restrictions:**
- FREE: Not allowed
- BASIC+: Allowed

**Response:**
```json
{
  "success": true,
  "message": "Export functionality coming soon",
  "reportType": "profit-loss",
  "format": "pdf"
}
```

### 4. Check Plan Information
**Endpoint:** `GET /api/tenant/plan`

**Response:**
```json
{
  "success": true,
  "currentPlan": {
    "id": "BASIC",
    "monthly": 29.99,
    "name": "Basic Plan",
    "subscriptionStartDate": "2024-01-01T00:00:00.000Z",
    "subscriptionEndDate": "2024-12-31T23:59:59.999Z"
  },
  "availableUpgrades": [
    {
      "id": "PREMIUM",
      "monthly": 99.99,
      "name": "Premium Plan"
    }
  ]
}
```

### 5. Upgrade Plan
**Endpoint:** `POST /api/tenant/upgrade`

**Body:**
```json
{
  "newPlan": "PREMIUM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Upgrade invoice created and sent successfully",
  "invoice": {
    "id": "inv_123",
    "invoiceNumber": "INV-2024-001",
    "amount": 99.99,
    "dueDate": "2024-02-01T00:00:00.000Z",
    "status": "PENDING",
    "plan": "PREMIUM"
  }
}
```

---

## Implementation Details

### Premium Feature Service

**Location:** `/src/lib/premium-features.ts`

**Key Classes:**
- `PremiumFeatureService`: Main service for checking feature access
- `PLAN_LIMITS`: Configuration object with all plan limits

**Key Methods:**

#### `canAddVehicle(tenantId: string)`
Checks if tenant can add more vehicles.

```typescript
const check = await PremiumFeatureService.canAddVehicle(tenantId);
if (!check.allowed) {
  return res.status(403).json({
    error: check.reason,
    upgradeMessage: check.upgradeMessage
  });
}
```

#### `canAddDriver(tenantId: string)`
Checks if tenant can add more drivers.

#### `canAddUser(tenantId: string, isAdmin: boolean)`
Checks if tenant can add more users (optionally admin users).

#### `hasFeatureAccess(tenantId: string, feature: keyof PlanLimits)`
Checks if tenant has access to a specific feature.

```typescript
const check = await PremiumFeatureService.hasFeatureAccess(
  tenantId,
  'advancedReporting'
);
```

#### `getUsageSummary(tenantId: string)`
Returns complete usage statistics and limits for a tenant.

### Upgrade Flow

1. **User initiates upgrade**
   - Frontend calls `POST /api/tenant/upgrade` with desired plan
   - System validates the new plan is higher than current plan

2. **Invoice generation**
   - System creates an upgrade invoice
   - Invoice includes prorated amount based on current billing cycle
   - Invoice PDF is generated and sent via email

3. **Payment processing**
   - User pays via PayNow gateway
   - `POST /api/payments/paynow/callback` receives payment confirmation

4. **Auto-upgrade**
   - Payment callback verifies payment
   - System updates tenant plan in database
   - Audit log records the upgrade
   - New features immediately available

**Code Reference:**
- Invoice creation: `/src/app/api/tenant/upgrade/route.ts`
- Payment callback: `/src/app/api/payments/paynow/callback/route.ts` (lines 244-292)

### Enforcing Limits in Code

**Pattern for checking limits:**

```typescript
// 1. Import the service
import { PremiumFeatureService } from '@/lib/premium-features';

// 2. Check the limit before performing action
const featureCheck = await PremiumFeatureService.canAddVehicle(tenantId);

// 3. Return 403 if not allowed
if (!featureCheck.allowed) {
  return NextResponse.json(
    {
      error: featureCheck.reason,
      currentUsage: featureCheck.currentUsage,
      limit: featureCheck.limit,
      suggestedPlan: featureCheck.suggestedPlan,
      upgradeMessage: featureCheck.upgradeMessage,
    },
    { status: 403 }
  );
}

// 4. Continue with the action
// ... create vehicle/driver/user
```

---

## Testing Premium Features

### Testing Plan Limits

**Test Vehicle Limit (FREE plan - 5 vehicles):**

1. Create a test tenant on FREE plan
2. Create 5 vehicles successfully
3. Attempt to create 6th vehicle
4. Should receive 403 error with upgrade message

**Test User Limit (FREE plan - 1 admin, 2 total):**

1. Signup creates 1 admin (tenant owner)
2. Add 1 regular user successfully
3. Attempt to add 3rd user
4. Should receive 403 error

**Test Reporting Access (FREE plan):**

1. Call `GET /api/reports/financial?type=summary` - Should work
2. Call `GET /api/reports/financial?type=profit-loss` - Should return 403

### Testing Upgrade Flow

1. **Start with FREE plan**
   ```bash
   curl -X GET http://localhost:3000/api/tenant/plan
   ```

2. **Initiate upgrade to BASIC**
   ```bash
   curl -X POST http://localhost:3000/api/tenant/upgrade \
     -H "Content-Type: application/json" \
     -d '{"newPlan": "BASIC"}'
   ```

3. **Check invoice was created**
   - Check email for invoice
   - Verify invoice in database

4. **Simulate payment**
   - Use PayNow test credentials
   - Complete payment

5. **Verify upgrade**
   ```bash
   curl -X GET http://localhost:3000/api/tenant/plan
   ```
   Should show BASIC plan

6. **Test new limits**
   - Should now be able to create up to 25 vehicles
   - Should have access to advanced reporting

### Database Queries for Testing

**Check current plan:**
```sql
SELECT id, name, plan, monthlyRevenue FROM tenants WHERE id = 'tenant_id';
```

**Check usage counts:**
```sql
SELECT
  t.name,
  t.plan,
  COUNT(DISTINCT v.id) as vehicle_count,
  COUNT(DISTINCT d.id) as driver_count,
  COUNT(DISTINCT u.id) as user_count
FROM tenants t
LEFT JOIN vehicles v ON v.tenantId = t.id
LEFT JOIN drivers d ON d.tenantId = t.id
LEFT JOIN users u ON u.tenantId = t.id
WHERE t.id = 'tenant_id'
GROUP BY t.id, t.name, t.plan;
```

---

## Frontend Integration

### Display Usage Information

```typescript
// Fetch usage summary
const response = await fetch('/api/tenant/features/usage');
const { data } = await response.json();

// Display usage bars
<UsageBar
  label="Vehicles"
  current={data.usage.vehicles.current}
  limit={data.usage.vehicles.limit}
  percentage={data.usage.vehicles.percentage}
/>
```

### Handle 403 Errors with Upgrade Prompts

```typescript
try {
  const response = await fetch('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicleData)
  });

  if (response.status === 403) {
    const error = await response.json();
    // Show upgrade modal
    showUpgradeModal({
      message: error.upgradeMessage,
      currentPlan: error.currentPlan,
      suggestedPlan: error.suggestedPlan
    });
  }
} catch (error) {
  // Handle error
}
```

### Display Plan Badge

```typescript
const { currentPlan } = await fetch('/api/tenant/plan').then(r => r.json());

<PlanBadge plan={currentPlan.id} />
// Shows "FREE", "BASIC", or "PREMIUM" badge
```

---

## Future Enhancements

### Short-term (Next 2-4 weeks)
- [ ] Implement actual API rate limiting with Redis
- [ ] Add scheduled reports feature for PREMIUM plan
- [ ] Implement SMS/WhatsApp notifications for PREMIUM
- [ ] Create white-labeling UI for PREMIUM

### Medium-term (1-3 months)
- [ ] Add predictive maintenance for PREMIUM
- [ ] Implement financial forecasting
- [ ] Multi-currency support
- [ ] Custom domain for PREMIUM tenants
- [ ] Implement report export (PDF, CSV, Excel)

### Long-term (3-6 months)
- [ ] AI-powered driver scoring
- [ ] GPS/Telematics integration
- [ ] Advanced automation workflows
- [ ] Third-party integrations (accounting software)
- [ ] Mobile app with offline sync
- [ ] Custom branding builder UI

---

## Support & Documentation

### For Developers
- Service code: `/src/lib/premium-features.ts`
- API routes: `/src/app/api/tenant/`, `/src/app/api/reports/`
- Upgrade logic: `/src/app/api/payments/paynow/callback/route.ts`

### For Customer Support
- Explain plan differences to customers
- Use `/api/tenant/features/usage` to check customer usage
- Guide customers through upgrade process at `/api/tenant/upgrade`

---

## Troubleshooting

### Issue: Limits not enforced after upgrade
**Solution:** Check that payment callback successfully updated tenant plan
```sql
SELECT plan, updatedAt FROM tenants WHERE id = 'tenant_id';
```

### Issue: User shows as exceeding limit but can't upgrade
**Solution:** Verify invoice was created and payment gateway is configured
```sql
SELECT * FROM invoices WHERE tenantId = 'tenant_id' ORDER BY createdAt DESC LIMIT 5;
```

### Issue: Feature shows as unavailable despite correct plan
**Solution:** Clear any cached tenant data and verify plan limits in code match database
```typescript
const limits = PremiumFeatureService.getPlanLimits('BASIC');
console.log(limits);
```

---

## Conclusion

The premium features system is designed to be:
- **Flexible**: Easy to add new features and adjust limits
- **Scalable**: Handles large numbers of tenants efficiently
- **User-friendly**: Clear upgrade prompts and messaging
- **Revenue-optimized**: Encourages upgrades at the right time

For questions or issues, contact the development team or open an issue in the repository.

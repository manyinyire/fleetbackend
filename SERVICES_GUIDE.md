## Service Layer Architecture Guide

This guide documents all service layers implemented in the Azaire Fleet Manager application.

## Table of Contents

1. [Overview](#overview)
2. [Service Layers](#service-layers)
3. [Usage Examples](#usage-examples)
4. [Query Optimization](#query-optimization)
5. [Best Practices](#best-practices)

---

## Overview

The service layer pattern separates business logic from API routes and server actions, providing:

- **Reusability**: Business logic can be used across multiple routes
- **Testability**: Services are easier to unit test
- **Maintainability**: Clear separation of concerns
- **Consistency**: Standardized error handling and logging

### Architecture

```
API Route / Server Action
    ↓
Service Layer (Business Logic)
    ↓
Prisma Client (Database)
```

---

## Service Layers

### 1. Vehicle Service

**File**: `src/services/vehicle.service.ts`

**Features**:
- CRUD operations for vehicles
- Vehicle statistics and analytics
- Payment model management
- Status tracking

**Usage**:
```typescript
import { VehicleService } from '@/services/vehicle.service';

// Initialize service
const vehicleService = new VehicleService(tenantId);

// Create vehicle
const vehicle = await vehicleService.create({
  registrationNumber: 'ABC123',
  make: 'Toyota',
  model: 'Hiace',
  year: 2020,
  type: 'OMNIBUS',
  initialCost: 15000,
  paymentModel: 'DRIVER_REMITS',
  paymentConfig: { dailyTarget: 100 }
}, userId);

// Get vehicle with relations
const vehicle = await vehicleService.findById(vehicleId);

// Search vehicles
const { vehicles, pagination } = await vehicleService.findAll({
  status: 'ACTIVE',
  search: 'Toyota',
  page: 1,
  limit: 10
});

// Get statistics
const stats = await vehicleService.getStatistics();
```

---

### 2. Driver Service

**File**: `src/services/driver.service.ts`

**Features**:
- Driver CRUD operations
- Vehicle assignment management
- Contract tracking
- Performance metrics
- Defensive license validation

**Usage**:
```typescript
import { DriverService } from '@/services/driver.service';

const driverService = new DriverService(tenantId);

// Create driver
const driver = await driverService.create({
  fullName: 'John Doe',
  nationalId: '12-345678-A-12',
  licenseNumber: 'DL123456',
  phone: '+263771234567',
  homeAddress: '123 Main St',
  nextOfKin: 'Jane Doe',
  nextOfKinPhone: '+263771234568',
  hasDefensiveLicense: true,
  defensiveLicenseNumber: 'DL-DEF-123',
  defensiveLicenseExpiry: new Date('2025-12-31')
}, userId);

// Assign vehicle
const assignment = await driverService.assignVehicle({
  driverId: driver.id,
  vehicleId: vehicleId,
  startDate: new Date(),
  isPrimary: true
}, userId);

// Get performance metrics
const performance = await driverService.getPerformance(
  driverId,
  startDate,
  endDate
);
// Returns: { totalRemitted, totalRemittances, targetsReached, targetComplianceRate }
```

---

### 3. Remittance Service

**File**: `src/services/remittance.service.ts`

**Features**:
- Remittance submission and tracking
- Approval/rejection workflow
- Target calculation
- Performance analytics
- Automatic income record creation

**Usage**:
```typescript
import { RemittanceService } from '@/services/remittance.service';

const remittanceService = new RemittanceService(tenantId);

// Submit remittance
const remittance = await remittanceService.create({
  driverId: driverId,
  vehicleId: vehicleId,
  amount: 120,
  date: new Date(),
  proofOfPayment: 's3://bucket/proof.jpg',
  notes: 'Daily remittance'
}, userId);

// Approve remittance (creates income record)
const approved = await remittanceService.approve({
  remittanceId: remittance.id,
  approvedBy: userId
}, userId);

// Get statistics
const stats = await remittanceService.getStatistics(startDate, endDate);
// Returns: { total, pending, approved, rejected, targetsReached, totalAmount }

// Get driver remittances
const { remittances, summary } = await remittanceService.getByDriver(
  driverId,
  startDate,
  endDate
);
```

---

### 4. Maintenance Service

**File**: `src/services/maintenance.service.ts`

**Features**:
- Maintenance record tracking
- Cost analysis
- Maintenance schedule calculation
- Automatic expense creation
- Overdue maintenance detection

**Usage**:
```typescript
import { MaintenanceService } from '@/services/maintenance.service';

const maintenanceService = new MaintenanceService(tenantId);

// Create maintenance record
const maintenance = await maintenanceService.create({
  vehicleId: vehicleId,
  date: new Date(),
  mileage: 50000,
  type: 'ROUTINE_SERVICE',
  description: '50,000km service',
  cost: 250,
  provider: 'AutoTech Garage',
  invoice: 's3://bucket/invoice.pdf'
}, userId);

// Get maintenance schedule
const schedules = await maintenanceService.getMaintenanceSchedule();
// Returns array of: { vehicleId, lastServiceDate, nextServiceDue, isOverdue }

// Get overdue vehicles
const overdue = await maintenanceService.getVehiclesDueForMaintenance();

// Get cost analysis
const costs = await maintenanceService.getCostByVehicle(startDate, endDate);
```

---

### 5. Financial Service

**File**: `src/services/financial.service.ts`

**Features**:
- Income and expense tracking
- Profit & Loss reports
- Cash flow analysis
- Expense approval workflow
- Vehicle profitability

**Usage**:
```typescript
import { FinancialService } from '@/services/financial.service';

const financialService = new FinancialService(tenantId);

// Create expense
const expense = await financialService.createExpense({
  vehicleId: vehicleId,
  category: 'FUEL',
  amount: 50,
  date: new Date(),
  description: 'Fuel refill',
  receipt: 's3://bucket/receipt.jpg'
}, userId);

// Approve expense
await financialService.approveExpense(expense.id, userId);

// Generate P&L report
const profitLoss = await financialService.getProfitLossReport(
  startDate,
  endDate
);
// Returns: { totalIncome, totalExpenses, netProfit, profitMargin, incomeBySource, expensesByCategory }

// Generate cash flow report
const cashFlow = await financialService.getCashFlowReport(
  startDate,
  endDate,
  openingBalance
);
// Returns: { openingBalance, totalIncome, totalExpenses, closingBalance, dailyCashFlow[] }

// Get vehicle profitability
const profitability = await financialService.getVehicleProfitability(
  vehicleId,
  startDate,
  endDate
);
```

---

### 6. Admin Service

**File**: `src/services/admin.service.ts`

**Features**:
- Platform-wide analytics
- Tenant management
- User activity tracking
- System health monitoring
- Revenue reports
- Tenant impersonation

**Usage**:
```typescript
import { AdminService } from '@/services/admin.service';

const adminService = new AdminService();

// Get platform analytics
const analytics = await adminService.getPlatformAnalytics();
// Returns: { overview, growth, planDistribution, topTenants }

// Get tenant analytics
const tenantAnalytics = await adminService.getTenantAnalytics(
  tenantId,
  startDate,
  endDate
);

// Update tenant status
await adminService.updateTenantStatus(tenantId, 'SUSPENDED', adminUserId);

// Update tenant plan
await adminService.updateTenantPlan(tenantId, 'PREMIUM', adminUserId);

// Get all tenants
const { tenants, pagination } = await adminService.getTenants({
  status: 'ACTIVE',
  plan: 'PREMIUM',
  search: 'company',
  page: 1,
  limit: 20
});

// Get system health
const health = await adminService.getSystemHealth();

// Get revenue report
const revenue = await adminService.getRevenueReport(startDate, endDate);

// Impersonate tenant
const impersonation = await adminService.impersonateTenant(
  tenantId,
  adminUserId
);
```

---

## Query Optimization

**File**: `src/lib/query-optimizer.ts`

### Performance Monitoring

```typescript
import { monitorQuery, queryMonitor } from '@/lib/query-optimizer';

// Monitor a query
const result = await monitorQuery(
  'fetchVehicles',
  () => prisma.vehicle.findMany()
);

// Get query statistics
const stats = queryMonitor.getStats();
const slowQueries = queryMonitor.getSlowQueries();
```

### Optimized Selects

```typescript
import { optimizedSelects } from '@/lib/query-optimizer';

// Use minimal selects to reduce data transfer
const users = await prisma.user.findMany({
  select: optimizedSelects.userMinimal
});

const vehicles = await prisma.vehicle.findMany({
  select: optimizedSelects.vehicleMinimal
});
```

### Pagination Helper

```typescript
import { paginatedQuery } from '@/lib/query-optimizer';

const result = await paginatedQuery(prisma, 'vehicle', {
  where: { status: 'ACTIVE' },
  include: { drivers: true },
  orderBy: { createdAt: 'desc' },
  page: 1,
  limit: 20
});

// Returns: { data: [], pagination: { total, page, limit, totalPages } }
```

### Cached Queries

```typescript
import { cachedQuery } from '@/lib/query-optimizer';

// Create cached version (uses React cache())
const getCachedVehicles = cachedQuery(
  () => prisma.vehicle.findMany(),
  'vehicles-list'
);

// Multiple calls in same request only query once
const vehicles1 = await getCachedVehicles();
const vehicles2 = await getCachedVehicles(); // Uses cache
```

### Query Builder

```typescript
import { QueryBuilder } from '@/lib/query-optimizer';

const queryConfig = QueryBuilder.list({
  model: 'vehicle',
  select: optimizedSelects.vehicleMinimal,
  search: {
    fields: ['registrationNumber', 'make', 'model'],
    term: searchTerm
  },
  dateRange: {
    field: 'createdAt',
    start: startDate,
    end: endDate
  },
  page: 1,
  limit: 20
});
```

---

## Best Practices

### 1. Always Use Services in API Routes

```typescript
// ❌ BAD: Direct Prisma in route
export async function GET(request: Request) {
  const vehicles = await prisma.vehicle.findMany();
  return NextResponse.json(vehicles);
}

// ✅ GOOD: Use service
export async function GET(request: Request) {
  const { user, tenantId } = await requireTenant();
  const vehicleService = new VehicleService(tenantId);
  const { vehicles, pagination } = await vehicleService.findAll();
  return NextResponse.json({ vehicles, pagination });
}
```

### 2. Handle Errors Properly

```typescript
import { createErrorResponse } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const { user, tenantId } = await requireTenant();
    const data = await request.json();

    const vehicleService = new VehicleService(tenantId);
    const vehicle = await vehicleService.create(data, user.id);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

### 3. Use Optimized Queries

```typescript
// ❌ BAD: Fetch all fields and relations
const vehicle = await prisma.vehicle.findMany({
  include: {
    drivers: {
      include: {
        driver: true
      }
    },
    remittances: true,
    maintenanceRecords: true
  }
});

// ✅ GOOD: Only fetch needed fields
const vehicle = await prisma.vehicle.findMany({
  select: {
    id: true,
    registrationNumber: true,
    make: true,
    model: true,
    status: true,
    drivers: {
      where: { endDate: null },
      select: {
        driver: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    }
  }
});
```

### 4. Run Independent Queries in Parallel

```typescript
// ❌ BAD: Sequential queries
const vehicles = await vehicleService.getStatistics();
const drivers = await driverService.getStatistics();
const remittances = await remittanceService.getStatistics();

// ✅ GOOD: Parallel queries
const [vehicles, drivers, remittances] = await Promise.all([
  vehicleService.getStatistics(),
  driverService.getStatistics(),
  remittanceService.getStatistics()
]);
```

### 5. Use Transactions for Related Operations

```typescript
// ✅ GOOD: Atomic operations
const [remittance, income] = await prisma.$transaction([
  prisma.remittance.update({
    where: { id: remittanceId },
    data: { status: 'APPROVED' }
  }),
  prisma.income.create({
    data: {
      tenantId,
      vehicleId,
      source: 'REMITTANCE',
      amount: remittanceAmount,
      date: new Date()
    }
  })
]);
```

### 6. Validate Input Before Database Operations

```typescript
async create(data: CreateVehicleDTO, userId: string) {
  // Validate
  if (data.amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }

  // Check duplicates
  const existing = await this.prisma.vehicle.findFirst({
    where: { registrationNumber: data.registrationNumber }
  });

  if (existing) {
    throw new ConflictError('Vehicle already exists');
  }

  // Create
  return await this.prisma.vehicle.create({ data });
}
```

### 7. Always Log Important Operations

```typescript
import { dbLogger } from '@/lib/logger';

async create(data: CreateVehicleDTO, userId: string) {
  try {
    const vehicle = await this.prisma.vehicle.create({ data });

    dbLogger.info({
      vehicleId: vehicle.id,
      userId,
      tenantId: this.tenantId
    }, 'Vehicle created');

    return vehicle;
  } catch (error) {
    dbLogger.error({ err: error, data }, 'Error creating vehicle');
    throw handlePrismaError(error);
  }
}
```

---

## Testing Services

```typescript
import { VehicleService } from '@/services/vehicle.service';

describe('VehicleService', () => {
  let service: VehicleService;

  beforeEach(() => {
    service = new VehicleService('test-tenant-id');
  });

  test('should create vehicle', async () => {
    const data = {
      registrationNumber: 'ABC123',
      make: 'Toyota',
      model: 'Hiace',
      year: 2020,
      type: 'OMNIBUS',
      initialCost: 15000,
      paymentModel: 'DRIVER_REMITS',
      paymentConfig: { dailyTarget: 100 }
    };

    const vehicle = await service.create(data, 'user-id');

    expect(vehicle).toBeDefined();
    expect(vehicle.registrationNumber).toBe('ABC123');
  });

  test('should throw error for duplicate registration', async () => {
    // Test error handling
    await expect(
      service.create(duplicateData, 'user-id')
    ).rejects.toThrow(ConflictError);
  });
});
```

---

## Summary

The service layer architecture provides:

1. **6 Complete Services**:
   - VehicleService
   - DriverService
   - RemittanceService
   - MaintenanceService
   - FinancialService
   - AdminService

2. **Query Optimization Tools**:
   - Performance monitoring
   - Optimized selects
   - Pagination helpers
   - Cached queries
   - Query builders

3. **Best Practices**:
   - Error handling
   - Logging
   - Validation
   - Transactions
   - Parallel queries

All services follow the same pattern and can be easily extended for additional features.

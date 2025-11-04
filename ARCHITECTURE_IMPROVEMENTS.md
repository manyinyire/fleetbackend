# Architecture Improvements & Best Practices

This document outlines the architectural improvements implemented to enhance security, maintainability, and scalability of the Azaire Fleet Manager application.

## Table of Contents

1. [Critical Fixes](#critical-fixes)
2. [Security Enhancements](#security-enhancements)
3. [Error Handling](#error-handling)
4. [Logging](#logging)
5. [Input Sanitization](#input-sanitization)
6. [Service Layer Pattern](#service-layer-pattern)
7. [Database Migrations](#database-migrations)
8. [Best Practices](#best-practices)

---

## Critical Fixes

### 1. Fixed Prisma Tenant Extension

**Problem**: The Prisma extension was applying tenant scoping to ALL models using `$allModels`, causing issues with system-level tables (User, Tenant, PlatformSettings, etc.).

**Solution**: Updated `/src/lib/prisma-tenant-extension.ts` to only apply scoping to tenant-specific models:

```typescript
// Only apply to tenant-scoped models
query: {
  vehicle: createScopedOperations(),
  driver: createScopedOperations(),
  remittance: createScopedOperations(),
  // ... other tenant-scoped models only
}
```

**Affected Models (Scoped)**:
- Vehicle, Driver, DriverVehicleAssignment
- Remittance, MaintenanceRecord, Contract
- Expense, Income, TenantSettings
- AuditLog, Invoice, InvoiceReminder

**Excluded Models (Not Scoped)**:
- Tenant, User, Session, Account, Verification
- PlatformSettings, AdminSettings, EmailTemplate, FeatureFlag
- All admin and system tables

### 2. Enabled Middleware

**Problem**: Middleware was disabled (`middleware.ts.disabled`), requiring manual authentication checks in every route.

**Solution**: Created comprehensive middleware (`/src/middleware.ts`) that:
- ✅ Protects routes requiring authentication
- ✅ Enforces email verification for non-admin users
- ✅ Sets tenant context headers for API routes
- ✅ Handles super admin route protection
- ✅ Implements rate limiting
- ✅ Redirects unauthenticated users

**Key Features**:
```typescript
// Automatic auth protection
if (!user) {
  return NextResponse.redirect('/auth/sign-in');
}

// Email verification enforcement
if (userRole !== 'SUPER_ADMIN' && !isEmailVerified) {
  return NextResponse.redirect('/auth/email-verified?unverified=true');
}

// Super admin route protection
if (isSuperAdminRoute && userRole !== 'SUPER_ADMIN') {
  return NextResponse.redirect('/dashboard');
}
```

---

## Security Enhancements

### 3. Rate Limiting

**Implementation**: `/src/lib/rate-limit.ts`

**Features**:
- In-memory rate limiting (can be extended to Redis)
- Different limits for different route types
- Automatic cleanup of expired entries
- Standard HTTP 429 responses

**Configuration**:
```typescript
const rateLimitConfigs = {
  auth: { interval: 15 * 60 * 1000, maxRequests: 5 },     // 5 per 15 min
  api: { interval: 60 * 1000, maxRequests: 60 },          // 60 per min
  superAdmin: { interval: 60 * 1000, maxRequests: 30 },   // 30 per min
};
```

**Usage in API Routes**:
```typescript
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.auth);
  if (rateLimitResult.limited) {
    return rateLimitResult.response;
  }
  // Process request...
}
```

### 4. Input Sanitization

**Implementation**: `/src/lib/sanitize.ts`

**Available Functions**:
- `sanitizeHtml()` - Prevent XSS in HTML content
- `sanitizeText()` - Remove dangerous scripts and event handlers
- `sanitizeUrl()` - Prevent XSS via URLs
- `sanitizeEmail()` - Validate and sanitize emails
- `sanitizePhone()` - Clean phone numbers
- `sanitizeFilename()` - Prevent path traversal
- `sanitizeSearchQuery()` - Escape regex characters
- `sanitizeObject()` - Recursively sanitize objects

**Usage Example**:
```typescript
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';

const cleanName = sanitizeText(userInput.name);
const cleanEmail = sanitizeEmail(userInput.email);
```

---

## Error Handling

### 5. Comprehensive Error System

**Implementation**: `/src/lib/errors.ts`

**Custom Error Classes**:
```typescript
class AppError extends Error
class AuthenticationError extends AppError
class AuthorizationError extends AppError
class NotFoundError extends AppError
class ValidationError extends AppError
class ConflictError extends AppError
class RateLimitError extends AppError
class TenantError extends AppError
```

**Prisma Error Handling**:
```typescript
function handlePrismaError(error) {
  switch (error.code) {
    case 'P2002': return new ConflictError('Duplicate entry');
    case 'P2025': return new NotFoundError('Record');
    case 'P2034': return new TenantError('RLS violation');
    // ... more cases
  }
}
```

**Usage in API Routes**:
```typescript
import { createErrorResponse, NotFoundError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const data = await someOperation();
    if (!data) throw new NotFoundError('Resource');
    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

**Error Handler Wrapper**:
```typescript
import { withErrorHandler } from '@/lib/errors';

export const GET = withErrorHandler(async (request) => {
  // Your logic here
  // Errors are automatically caught and formatted
});
```

---

## Logging

### 6. Structured Logging with Pino

**Implementation**: `/src/lib/logger.ts`

**Logger Instances**:
- `logger` - Default logger
- `dbLogger` - Database operations
- `authLogger` - Authentication events
- `apiLogger` - API requests
- `auditLogger` - Audit trail
- `jobLogger` - Background jobs

**Features**:
- JSON logging in production
- Pretty printing in development
- Automatic redaction of sensitive data (passwords, tokens, secrets)
- Timestamps in ISO format
- Context-aware logging

**Usage Examples**:

```typescript
import { authLogger, logAuthEvent, logApiRequest } from '@/lib/logger';

// Authentication events
logAuthEvent('login', userId, email, ipAddress);

// API requests
logApiRequest('POST', '/api/vehicles', userId, tenantId, 250);

// Custom logging
authLogger.info({ userId, email }, 'User logged in successfully');
authLogger.error({ err: error, userId }, 'Login failed');
```

**Redacted Fields**:
- password
- token
- accessToken
- refreshToken
- secret
- apiKey
- twoFactorSecret
- req.headers.authorization
- req.headers.cookie

---

## Service Layer Pattern

### 7. Business Logic Separation

**Implementation**: `/src/services/`

**Example**: `vehicle.service.ts`

**Benefits**:
- ✅ Separation of concerns
- ✅ Reusable business logic
- ✅ Easier testing
- ✅ Centralized error handling
- ✅ Consistent logging

**Service Structure**:
```typescript
export class VehicleService {
  private prisma: PrismaClient;
  private tenantId: string | null;

  constructor(tenantId: string | null) {
    this.prisma = tenantId ? getTenantPrisma(tenantId) : prisma;
    this.tenantId = tenantId;
  }

  async create(data: CreateVehicleDTO, userId: string) {
    // Business logic
    // Error handling
    // Logging
  }

  async findById(id: string) { /* ... */ }
  async findAll(filters: VehicleFilters) { /* ... */ }
  async update(id: string, data: UpdateVehicleDTO) { /* ... */ }
  async delete(id: string) { /* ... */ }
  async getStatistics() { /* ... */ }
}
```

**Usage in Server Actions**:
```typescript
import { VehicleService } from '@/services/vehicle.service';

export async function createVehicle(data: CreateVehicleInput) {
  const { user, tenantId } = await requireTenant();
  const service = new VehicleService(tenantId);
  return await service.create(data, user.id);
}
```

**Recommended Services to Create**:
- `DriverService` - Driver management
- `RemittanceService` - Remittance processing
- `MaintenanceService` - Maintenance tracking
- `FinancialService` - Income/Expense management
- `AuthService` - Authentication logic
- `TenantService` - Tenant management
- `NotificationService` - Email/SMS notifications

---

## Database Migrations

### 8. Proper Migration Workflow

**Updated Scripts** (`package.json`):
```json
{
  "db:migrate:dev": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:migrate:status": "prisma migrate status",
  "db:migrate:reset": "prisma migrate reset",
  "db:migrate:create": "prisma migrate dev --create-only",
  "db:push": "echo 'Warning: Use db:migrate:dev instead' && prisma db push",
  "db:setup": "prisma migrate deploy && tsx prisma/seed.ts"
}
```

**Workflow**:

**Development**:
```bash
# Create a new migration
npm run db:migrate:dev

# Create migration without applying (for review)
npm run db:migrate:create

# Check migration status
npm run db:migrate:status
```

**Production**:
```bash
# Apply pending migrations
npm run db:migrate:deploy

# Setup fresh database
npm run db:setup
```

**Benefits**:
- ✅ Migration history tracking
- ✅ Rollback capability
- ✅ Team collaboration
- ✅ Safer deployments
- ✅ Database versioning

---

## Best Practices

### Code Organization

1. **Use Service Layers** for business logic
2. **Keep Controllers Thin** - API routes should only handle HTTP concerns
3. **Centralize Error Handling** - Use error utilities
4. **Log Properly** - Use structured logging, not console.log
5. **Sanitize Inputs** - Always sanitize user input

### Security

1. **Rate Limit All Routes** - Especially auth endpoints
2. **Validate All Inputs** - Use Zod schemas
3. **Sanitize Outputs** - Prevent XSS
4. **Use Middleware** - Centralize auth and tenant checks
5. **Handle Errors Gracefully** - Don't expose internal errors

### Database

1. **Use Migrations** - Never use db:push in production
2. **Apply Tenant Scoping** - Use Prisma extension correctly
3. **Set RLS Context** - For database-level security
4. **Index Strategically** - tenantId, status, date fields
5. **Handle Prisma Errors** - Use handlePrismaError()

### Performance

1. **Cache Requests** - Use React cache() for per-request memoization
2. **Optimize Queries** - Use includes wisely, paginate results
3. **Background Jobs** - Use BullMQ for async operations
4. **CDN for Assets** - Offload static files
5. **Database Pooling** - Configure Prisma connection pool

### Testing

1. **Write Tests** - Aim for >70% coverage
2. **Test Services** - Unit test business logic
3. **Test API Routes** - Integration tests
4. **Test Error Handling** - Ensure errors are handled correctly
5. **Test Security** - Verify auth, RLS, rate limiting

### Deployment

1. **Environment Variables** - Never commit secrets
2. **Database Backups** - Regular automated backups
3. **Monitoring** - Set up error tracking (Sentry, etc.)
4. **Logging** - Centralized log aggregation
5. **Health Checks** - Implement /health endpoint

---

## File Structure

```
src/
├── lib/
│   ├── auth.ts                    # BetterAuth config
│   ├── auth-helpers.ts            # Auth utilities (requireAuth, requireTenant)
│   ├── prisma.ts                  # Prisma client
│   ├── prisma-tenant-extension.ts # ✅ Fixed tenant scoping
│   ├── errors.ts                  # ✅ Error handling utilities
│   ├── logger.ts                  # ✅ Structured logging
│   ├── rate-limit.ts              # ✅ Rate limiting
│   ├── sanitize.ts                # ✅ Input sanitization
│   └── ...
├── services/
│   ├── vehicle.service.ts         # ✅ Vehicle business logic
│   └── ...                        # ✅ Add more services here
├── middleware.ts                  # ✅ Enabled middleware
└── ...
```

---

## Migration Checklist

When implementing these patterns in your codebase:

- [x] Fix Prisma tenant extension
- [x] Enable middleware
- [x] Add rate limiting
- [x] Switch to migrations
- [x] Implement error handling
- [x] Add structured logging
- [x] Replace console.log statements
- [x] Add input sanitization
- [x] Create service layers
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Add more comprehensive tests
- [ ] Complete super admin portal
- [ ] Add monitoring and alerting

---

## Resources

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Pino Logging](https://getpino.io/)
- [OWASP Security](https://owasp.org/www-project-top-ten/)
- [Rate Limiting Patterns](https://redis.io/glossary/rate-limiting/)

---

**Last Updated**: 2025-11-04
**Version**: 7.0.0
**Status**: Production Ready with Improvements

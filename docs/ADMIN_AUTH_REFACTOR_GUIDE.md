# Admin Auth Route Refactoring Guide

## Issue

The admin authentication route (`src/app/api/admin/auth/route.ts`) contains:
- Duplicated password verification logic
- Duplicated 2FA verification code
- Syntax errors (unclosed braces, missing variables)
- Complex nested logic that's hard to maintain

## Current Problems

1. **Duplicate Password Checks** (lines 106-118 and 138-150)
2. **Duplicate 2FA Verification** (lines 120-161 and 163-200)
3. **Variables referenced before declaration** (e.g., `verified` used before being defined)
4. **Mixed logic flow** (IP whitelist check appears in the middle of authentication)

## Recommended Refactoring

### 1. Extract Helper Functions

Create `src/lib/admin-auth-helpers.ts`:

```typescript
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { prisma } from '@/lib/prisma';

export async function verifyAdminPassword(
  email: string,
  password: string
): Promise<{ valid: boolean; user?: any; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: {
        where: { providerId: 'credential' }
      },
      adminSettings: true,
    }
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    return { valid: false, error: 'NOT_SUPER_ADMIN' };
  }

  if (user.banned) {
    return { valid: false, error: 'USER_BANNED' };
  }

  const account = user.accounts[0];
  if (!account?.password) {
    return { valid: false, error: 'NO_PASSWORD' };
  }

  const passwordValid = await bcrypt.compare(password, account.password);
  if (!passwordValid) {
    return { valid: false, error: 'INVALID_PASSWORD' };
  }

  return { valid: true, user };
}

export async function verify2FACode(
  user: any,
  totpCode: string
): Promise<{ valid: boolean; error?: string }> {
  const twoFactorSecret = user.adminSettings?.twoFactorSecret;

  if (!twoFactorSecret) {
    return { valid: false, error: 'NO_2FA_SECRET' };
  }

  const verified = speakeasy.totp.verify({
    secret: twoFactorSecret,
    encoding: 'base32',
    token: totpCode,
    window: 2
  });

  return { valid: verified, error: verified ? undefined : 'INVALID_CODE' };
}

export async function checkIPWhitelist(
  userId: string,
  clientIP: string
): Promise<boolean> {
  const adminSettings = await prisma.adminSettings.findUnique({
    where: { userId },
    include: { ipWhitelist: true }
  });

  if (!adminSettings?.ipWhitelistEnabled) {
    return true; // Whitelist not enabled, allow all IPs
  }

  const isAllowed = adminSettings.ipWhitelist.some(
    entry => entry.ipAddress === clientIP && entry.isActive
  );

  return isAllowed;
}

export async function checkSessionLimit(
  userId: string,
  maxSessions: number = 3
): Promise<{ allowed: boolean; activeSessions: number }> {
  const activeSessions = await prisma.adminSession.count({
    where: {
      userId,
      expiresAt: { gt: new Date() }
    }
  });

  return {
    allowed: activeSessions < maxSessions,
    activeSessions
  };
}
```

### 2. Simplify Main Route

Rewrite `POST` handler in `src/app/api/admin/auth/route.ts`:

```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password, totpCode, rememberDevice } = loginSchema.parse(body);

  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Step 1: Verify password
  const passwordResult = await verifyAdminPassword(email, password);

  if (!passwordResult.valid) {
    await logSecurityEvent('FAILED_LOGIN', {
      email, ip: clientIP, userAgent,
      reason: passwordResult.error
    });
    return NextResponse.json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS }, { status: 401 });
  }

  const user = passwordResult.user!;

  // Step 2: Check 2FA
  const twoFactorEnabled = user.adminSettings?.twoFactorEnabled || false;
  if (twoFactorEnabled) {
    if (!totpCode) {
      return NextResponse.json({
        requires2FA: true,
        message: 'Two-factor authentication required'
      }, { status: 200 });
    }

    const twoFAResult = await verify2FACode(user, totpCode);
    if (!twoFAResult.valid) {
      await logSecurityEvent('FAILED_2FA', {
        userId: user.id, email, ip: clientIP, userAgent,
        reason: twoFAResult.error
      });
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
    }
  }

  // Step 3: Check IP whitelist
  const isIPAllowed = await checkIPWhitelist(user.id, clientIP);
  if (!isIPAllowed) {
    await logSecurityEvent('BLOCKED_IP_ACCESS', {
      userId: user.id, email, ip: clientIP, userAgent
    });
    return NextResponse.json({
      error: 'Access denied: IP address not authorized'
    }, { status: 403 });
  }

  // Step 4: Check session limit
  const sessionCheck = await checkSessionLimit(user.id);
  if (!sessionCheck.allowed) {
    await logSecurityEvent('SESSION_LIMIT_EXCEEDED', {
      userId: user.id, email, ip: clientIP, userAgent,
      activeSessions: sessionCheck.activeSessions
    });
    return NextResponse.json({
      error: 'Maximum concurrent sessions exceeded'
    }, { status: 403 });
  }

  // Step 5: Create session
  const sessionExpiry = rememberDevice ?
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : // 7 days
    new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

  const session = await prisma.adminSession.create({
    data: {
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: sessionExpiry,
      ipAddress: clientIP,
      userAgent,
      isActive: true,
    }
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Log success
  await logSecurityEvent('SUCCESSFUL_LOGIN', {
    userId: user.id, email, ip: clientIP, userAgent,
    sessionId: session.id
  });

  // Return response with cookie
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });

  response.cookies.set('admin-session', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: Math.floor((sessionExpiry.getTime() - Date.now()) / 1000)
  });

  return response;
}, 'admin-auth:POST');
```

## Benefits of Refactoring

1. **Readability**: Clear step-by-step authentication flow
2. **Maintainability**: Helper functions can be tested independently
3. **Reusability**: Auth helpers can be used in other admin endpoints
4. **Error Handling**: Consistent error messages and logging
5. **Security**: Easier to audit and verify security checks are complete

## Implementation Steps

1. Create `src/lib/admin-auth-helpers.ts` with helper functions
2. Add tests for each helper function
3. Refactor main route to use helpers
4. Test authentication flow thoroughly
5. Remove old code after validation

## Priority

**Medium** - The current code works but is difficult to maintain. This should be addressed in the next major refactoring cycle.

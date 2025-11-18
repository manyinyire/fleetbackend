import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { authLogger } from '@/lib/logger';
import {
  verifyAdminPassword,
  verify2FACode,
  checkIPWhitelist,
  checkSessionLimit,
  createAdminSession,
  updateLastLogin,
  getClientIP,
  getUserAgent,
} from '@/lib/admin-auth-helpers';

export const runtime = 'nodejs';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().optional(),
  rememberDevice: z.boolean().optional()
});

const ipWhitelistSchema = z.object({
  ipAddress: z.string().ip(),
  description: z.string().min(1),
  isActive: z.boolean().default(true)
});

// Error messages (prevent user enumeration)
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  TWO_FACTOR_REQUIRED: 'Two-factor authentication required',
  INVALID_2FA: 'Invalid 2FA code',
  IP_BLOCKED: 'Access denied: IP address not authorized. Please contact support.',
  SESSION_LIMIT: 'Maximum concurrent sessions exceeded. Please log out from another device.',
  ACCOUNT_SUSPENDED: 'Account has been suspended',
};

// Maximum concurrent sessions per admin
const MAX_CONCURRENT_SESSIONS = 3;

/**
 * Security event data type
 */
interface SecurityEventData {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
  sessionId?: string;
  activeSessions?: number;
  maxSessions?: number;
  rememberDevice?: boolean;
  ipAddress?: string;
  description?: string;
  enabled?: boolean;
  errorCode?: string;
}

/**
 * Security event logger
 */
async function logSecurityEvent(action: string, data: SecurityEventData) {
  try {
    // If we have a userId, log to audit log
    if (data.userId) {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action,
          entityType: 'AdminAuth',
          entityId: data.userId,
          newValues: data,
          ipAddress: data.ip || 'unknown',
          userAgent: data.userAgent || 'unknown',
        }
      });
    }

    authLogger.info({ action, ...data }, 'Admin security event');
  } catch (error) {
    authLogger.error({ err: error, action, data }, 'Failed to log security event');
  }
}

/**
 * Admin Login Handler
 * POST /api/admin/auth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, totpCode, rememberDevice } = loginSchema.parse(body);

    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Step 1: Verify password and get user
    const passwordResult = await verifyAdminPassword(email, password);

    if (!passwordResult.success) {
      await logSecurityEvent('FAILED_LOGIN', {
        email,
        ip: clientIP,
        userAgent,
        reason: passwordResult.errorCode
      });

      // Return appropriate error
      if (passwordResult.errorCode === 'USER_BANNED') {
        return NextResponse.json(
          { error: passwordResult.error },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    const user = passwordResult.user!;

    // Step 2: Check 2FA if enabled
    const twoFactorEnabled = user.adminSettings?.twoFactorEnabled || false;

    if (twoFactorEnabled) {
      if (!totpCode) {
        return NextResponse.json({
          requires2FA: true,
          message: ERROR_MESSAGES.TWO_FACTOR_REQUIRED
        }, { status: 200 });
      }

      const twoFAResult = await verify2FACode(user, totpCode);
      if (!twoFAResult.success) {
        await logSecurityEvent('FAILED_2FA', {
          userId: user.id,
          email,
          ip: clientIP,
          userAgent,
          reason: twoFAResult.errorCode
        });

        return NextResponse.json(
          { error: ERROR_MESSAGES.INVALID_2FA },
          { status: 401 }
        );
      }
    }

    // Step 3: Check IP whitelist
    const ipCheckResult = await checkIPWhitelist(user.id, clientIP);
    if (!ipCheckResult.allowed) {
      await logSecurityEvent('BLOCKED_IP_ACCESS', {
        userId: user.id,
        email,
        ip: clientIP,
        userAgent,
        reason: ipCheckResult.reason
      });

      return NextResponse.json(
        { error: ERROR_MESSAGES.IP_BLOCKED },
        { status: 403 }
      );
    }

    // Step 4: Check session limit
    const sessionLimitResult = await checkSessionLimit(user.id, MAX_CONCURRENT_SESSIONS);
    if (!sessionLimitResult.allowed) {
      await logSecurityEvent('SESSION_LIMIT_EXCEEDED', {
        userId: user.id,
        email,
        ip: clientIP,
        userAgent,
        activeSessions: sessionLimitResult.activeSessions,
        maxSessions: MAX_CONCURRENT_SESSIONS
      });

      return NextResponse.json(
        { error: ERROR_MESSAGES.SESSION_LIMIT },
        { status: 403 }
      );
    }

    // Step 5: Create admin session
    const session = await createAdminSession(
      user.id,
      clientIP,
      userAgent,
      rememberDevice || false
    );

    // Step 6: Update last login time
    await updateLastLogin(user.id);

    // Step 7: Log successful login
    await logSecurityEvent('SUCCESSFUL_LOGIN', {
      userId: user.id,
      email,
      ip: clientIP,
      userAgent,
      sessionId: session.id,
      rememberDevice: rememberDevice || false
    });

    // Step 8: Return response with secure cookie
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
      maxAge: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    });

    return response;

  } catch (error) {
    authLogger.error({ err: error }, 'Admin login failed');

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Setup 2FA
 * PUT /api/admin/auth
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, action, totpCode } = await request.json();

    if (action === 'enable-2fa') {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: 'Azaire Admin',
        issuer: 'Azaire Fleet Manager'
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Save secret temporarily (not activated yet)
      await prisma.adminSettings.upsert({
        where: { userId },
        create: {
          userId,
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false, // Not enabled until verified
        },
        update: {
          twoFactorSecret: secret.base32,
        }
      });

      authLogger.info({ userId }, '2FA setup initiated');

      return NextResponse.json({
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32
      });
    }

    if (action === 'verify-2fa') {
      const adminSettings = await prisma.adminSettings.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!adminSettings?.twoFactorSecret) {
        return NextResponse.json(
          { error: 'No 2FA secret found' },
          { status: 400 }
        );
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: adminSettings.twoFactorSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2
      });

      if (verified) {
        // Enable 2FA
        await prisma.adminSettings.update({
          where: { userId },
          data: { twoFactorEnabled: true }
        });

        await logSecurityEvent('2FA_ENABLED', {
          userId,
          email: adminSettings.user.email
        });

        authLogger.info({ userId }, '2FA enabled successfully');

        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: 'Invalid code' },
          { status: 400 }
        );
      }
    }

    if (action === 'disable-2fa') {
      const adminSettings = await prisma.adminSettings.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!adminSettings?.twoFactorSecret || !adminSettings.twoFactorEnabled) {
        return NextResponse.json(
          { error: '2FA is not enabled' },
          { status: 400 }
        );
      }

      // Verify TOTP code before disabling
      const verified = speakeasy.totp.verify({
        secret: adminSettings.twoFactorSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2
      });

      if (verified) {
        await prisma.adminSettings.update({
          where: { userId },
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
          }
        });

        await logSecurityEvent('2FA_DISABLED', {
          userId,
          email: adminSettings.user.email
        });

        authLogger.info({ userId }, '2FA disabled');

        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: 'Invalid code' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    authLogger.error({ err: error }, '2FA setup failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * IP Whitelist Management
 * PATCH /api/admin/auth
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId, action, ...data } = await request.json();

    if (action === 'add-ip') {
      const { ipAddress, description } = ipWhitelistSchema.parse(data);

      const whitelistEntry = await prisma.adminIpWhitelist.create({
        data: {
          userId,
          ipAddress,
          description,
          isActive: true,
        }
      });

      await logSecurityEvent('IP_WHITELIST_ADDED', {
        userId,
        ipAddress,
        description
      });

      authLogger.info({ userId, ipAddress }, 'IP added to whitelist');

      return NextResponse.json(whitelistEntry);
    }

    if (action === 'remove-ip') {
      const { ipAddress } = data;

      await prisma.adminIpWhitelist.deleteMany({
        where: {
          userId,
          ipAddress
        }
      });

      await logSecurityEvent('IP_WHITELIST_REMOVED', {
        userId,
        ipAddress
      });

      authLogger.info({ userId, ipAddress }, 'IP removed from whitelist');

      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-whitelist') {
      const { enabled } = data;

      await prisma.adminSettings.upsert({
        where: { userId },
        create: {
          userId,
          ipWhitelistEnabled: enabled,
        },
        update: {
          ipWhitelistEnabled: enabled,
        }
      });

      await logSecurityEvent('IP_WHITELIST_TOGGLED', {
        userId,
        enabled
      });

      authLogger.info({ userId, enabled }, 'IP whitelist toggled');

      return NextResponse.json({ success: true, enabled });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    authLogger.error({ err: error }, 'IP whitelist management failed');

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Admin Logout
 * DELETE /api/admin/auth
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-session')?.value;

    if (token) {
      // Invalidate the session - simply delete sessions by cookie
      // The token is stored in a cookie, not in the database

      const clientIP = getClientIP(request);
      const userAgent = getUserAgent(request);

      // Log the logout event
      await logSecurityEvent('LOGOUT', {
        userId: 'unknown',
        email: 'admin',
        ip: clientIP,
        userAgent,
        sessionId: token
      });
    }

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin-session');

    return response;

  } catch (error) {
    authLogger.error({ err: error }, 'Logout failed');
    // Still clear cookie even if logging fails
    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin-session');
    return response;
  }
}

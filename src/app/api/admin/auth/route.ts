import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/api';
import { ERROR_MESSAGES } from '@/config/constants';

export const runtime = 'nodejs';

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

// Security event logger
async function logSecurityEvent(action: string, data: any) {
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

    logger.info({ action, ...data }, 'Admin security event');
  } catch (error) {
    logger.error({ err: error, action, data }, 'Failed to log security event');
  }
}

// Super Admin Login Route
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password, totpCode, rememberDevice } = loginSchema.parse(body);

  // Get client IP
  const clientIP = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  '127.0.0.1';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: {
        where: {
          providerId: 'credential' // Better-auth stores password in accounts
        }
      },
      adminSettings: true,
    }
  });

  if (!user || user.role !== 'SUPER_ADMIN') {
    await logSecurityEvent('FAILED_LOGIN', {
      email,
      ip: clientIP,
      userAgent,
      reason: 'Not a super admin user'
    });

    // Use generic message to prevent user enumeration
    return NextResponse.json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS }, { status: 401 });
  }

  // Check if user is banned
  if (user.banned) {
    await logSecurityEvent('BLOCKED_LOGIN', {
      userId: user.id,
      email,
      ip: clientIP,
      userAgent,
      reason: 'User is banned'
    });
    return NextResponse.json({
      error: user.banReason || 'Account has been suspended'
    }, { status: 403 });
  }

  // Get password hash from account
  const account = user.accounts[0];
  if (!account || !account.password) {
    logger.error({ userId: user.id, email }, 'Admin user has no password');
    return NextResponse.json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS }, { status: 401 });
  }

  // Verify password using bcrypt
  const passwordValid = await bcrypt.compare(password, account.password);

  if (!passwordValid) {
    await logSecurityEvent('FAILED_LOGIN', {
      userId: user.id,
      email,
      ip: clientIP,
      userAgent,
      reason: 'Invalid password'
    });
    return NextResponse.json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS }, { status: 401 });
  }

  // Check if 2FA is enabled for this admin
  const twoFactorEnabled = user.adminSettings?.twoFactorEnabled || false;

  if (twoFactorEnabled) {
    if (!totpCode) {
      return NextResponse.json({
        requires2FA: true,
        message: 'Two-factor authentication required'
      }, { status: 200 });
    }

    // Verify TOTP code
    const twoFactorSecret = user.adminSettings?.twoFactorSecret;
    if (!twoFactorSecret) {
      logger.error({ userId: user.id }, '2FA enabled but no secret found');
      return NextResponse.json({ error: 'Two-factor configuration error' }, { status: 500 });
    }

    const verified = speakeasy.totp.verify({
      secret: twoFactorSecret,
      encoding: 'base32',
      token: totpCode,
      window: 2 // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      await logSecurityEvent('FAILED_2FA', {
        userId: user.id,
        email,
        ip: clientIP,
        userAgent,
        reason: 'Invalid TOTP code'
      });
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
    }
  }

  // Check IP whitelist if enabled
  const ipWhitelistEnabled = user.adminSettings?.ipWhitelistEnabled || false;

  if (ipWhitelistEnabled) {
    const whitelistedIPs = await prisma.adminIpWhitelist.findMany({
      where: {
        userId: user.id,
        isActive: true
      }
    });

    const isIPAllowed = whitelistedIPs.some(entry => entry.ipAddress === clientIP);

    if (!isIPAllowed) {
      await logSecurityEvent('BLOCKED_IP_ACCESS', {
        userId: user.id,
        email,
        ip: clientIP,
        userAgent,
        reason: 'IP not in whitelist'
      });
      return NextResponse.json({
        error: 'Access denied: IP address not authorized. Please contact support.'
      }, { status: 403 });
    }
  }

  // Check for concurrent session limit
  const maxSessions = user.adminSettings?.maxConcurrentSessions || 3;
  const activeSessions = await prisma.adminSession.count({
    where: {
      userId: user.id,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (activeSessions >= maxSessions) {
    await logSecurityEvent('SESSION_LIMIT_EXCEEDED', {
      userId: user.id,
      email,
      ip: clientIP,
      userAgent,
      activeSessions,
      maxSessions
    });
    return NextResponse.json({
      error: `Maximum concurrent sessions (${maxSessions}) exceeded. Please log out from another device.`
    }, { status: 403 });
  }

  // Create admin session
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

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Log successful login
  await logSecurityEvent('SUCCESSFUL_LOGIN', {
    userId: user.id,
    email,
    ip: clientIP,
    userAgent,
    sessionId: session.id,
    rememberDevice: rememberDevice || false
  });

  // Set session cookie
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

// Setup 2FA
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const { userId, action } = await request.json();

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

    logger.info({ userId }, '2FA setup initiated');

    return NextResponse.json({
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32
    });
  }

  if (action === 'verify-2fa') {
    const { totpCode } = await request.json();

    const adminSettings = await prisma.adminSettings.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!adminSettings?.twoFactorSecret) {
      return NextResponse.json({ error: 'No 2FA secret found' }, { status: 400 });
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
        data: {
          twoFactorEnabled: true,
        }
      });

      await logSecurityEvent('2FA_ENABLED', {
        userId,
        email: adminSettings.user.email
      });

      logger.info({ userId }, '2FA enabled successfully');

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
  }

  if (action === 'disable-2fa') {
    const { totpCode } = await request.json();

    const adminSettings = await prisma.adminSettings.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!adminSettings?.twoFactorSecret || !adminSettings.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
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

      logger.info({ userId }, '2FA disabled');

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}, 'admin-auth:PUT');

// IP Whitelist Management
export const PATCH = withErrorHandler(async (request: NextRequest) => {
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

    logger.info({ userId, ipAddress }, 'IP added to whitelist');

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

    logger.info({ userId, ipAddress }, 'IP removed from whitelist');

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

    logger.info({ userId, enabled }, 'IP whitelist toggled');

    return NextResponse.json({ success: true, enabled });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}, 'admin-auth:PATCH');

// Logout
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin-session')?.value;

    if (sessionToken) {
      // Deactivate session
      await prisma.adminSession.updateMany({
        where: { token: sessionToken },
        data: { isActive: false }
      });

      logger.info({ sessionToken }, 'Admin logged out');
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin-session');

    return response;
  } catch (error) {
    logger.error({ err: error }, 'Logout error');
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

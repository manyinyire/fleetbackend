/**
 * Admin Authentication Helper Functions
 *
 * Extracted from admin auth route to eliminate code duplication
 * and improve maintainability and testability.
 */

import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { prisma } from '@/lib/prisma';

/**
 * Result type for authentication operations
 */
export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  errorCode?: string;
}

/**
 * Verify admin user password
 * Checks user exists, is super admin, not banned, and password is correct
 */
export async function verifyAdminPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  // Find user with accounts and admin settings
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: {
        where: { providerId: 'credential' }
      },
      adminSettings: true,
    }
  });

  // Check if user exists and is super admin
  if (!user || user.role !== 'SUPER_ADMIN') {
    return {
      success: false,
      errorCode: 'NOT_SUPER_ADMIN',
      error: 'Invalid credentials'
    };
  }

  // Check if user is banned
  if (user.banned) {
    return {
      success: false,
      errorCode: 'USER_BANNED',
      error: user.banReason || 'Account has been suspended'
    };
  }

  // Get password from account
  const account = user.accounts[0];
  if (!account?.password) {
    return {
      success: false,
      errorCode: 'NO_PASSWORD',
      error: 'Invalid credentials'
    };
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, account.password);
  if (!passwordValid) {
    return {
      success: false,
      errorCode: 'INVALID_PASSWORD',
      error: 'Invalid credentials'
    };
  }

  return {
    success: true,
    user
  };
}

/**
 * Verify 2FA TOTP code
 */
export async function verify2FACode(
  user: any,
  totpCode: string
): Promise<AuthResult> {
  const twoFactorSecret = user.adminSettings?.twoFactorSecret;

  if (!twoFactorSecret) {
    return {
      success: false,
      errorCode: 'NO_2FA_SECRET',
      error: 'Two-factor authentication configuration error'
    };
  }

  const verified = speakeasy.totp.verify({
    secret: twoFactorSecret,
    encoding: 'base32',
    token: totpCode,
    window: 2 // Allow 2 time steps before/after for clock skew
  });

  if (!verified) {
    return {
      success: false,
      errorCode: 'INVALID_2FA_CODE',
      error: 'Invalid 2FA code'
    };
  }

  return { success: true };
}

/**
 * Check if IP is whitelisted for admin access
 */
export async function checkIPWhitelist(
  userId: string,
  clientIP: string
): Promise<{ allowed: boolean; reason?: string }> {
  const adminSettings = await prisma.adminSettings.findUnique({
    where: { userId },
    include: { ipWhitelist: true }
  });

  // If whitelist not enabled, allow all IPs
  if (!adminSettings?.ipWhitelistEnabled) {
    return { allowed: true };
  }

  // Check if IP is in whitelist
  const isAllowed = adminSettings.ipWhitelist.some(
    entry => entry.ipAddress === clientIP && entry.isActive
  );

  if (!isAllowed) {
    return {
      allowed: false,
      reason: 'IP not in whitelist'
    };
  }

  return { allowed: true };
}

/**
 * Check admin session limit
 */
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

/**
 * Create admin session
 */
export async function createAdminSession(
  userId: string,
  clientIP: string,
  userAgent: string,
  rememberDevice: boolean = false
): Promise<any> {
  const sessionExpiry = rememberDevice
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    : new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

  const session = await prisma.adminSession.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt: sessionExpiry,
      ipAddress: clientIP,
      userAgent,
      isActive: true,
    }
  });

  return session;
}

/**
 * Update user last login time
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  });
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         headers.get('x-real-ip') ||
         '127.0.0.1';
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

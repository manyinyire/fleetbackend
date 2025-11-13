/**
 * NextAuth v5 API Compatibility Layer
 *
 * Provides BetterAuth-style API methods that were used throughout the codebase
 * but don't exist in NextAuth v5. This allows gradual migration without breaking
 * existing admin/superadmin routes.
 *
 * IMPORTANT: This is a temporary compatibility layer. Eventually, routes should
 * be refactored to use NextAuth v5's native methods directly.
 */

import { prisma } from './prisma';
import { signIn } from './auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { apiLogger } from './logger';

/**
 * Sign in with email and password
 * Compatible with BetterAuth's signInEmail method
 */
export async function signInEmail(params: {
  body: {
    email: string;
    password: string;
    callbackURL?: string;
  };
  headers: Headers;
}) {
  try {
    const { email, password } = params.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !user.password) {
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return null;
    }

    // Check if user is banned
    if (user.banned) {
      throw new Error(user.banReason || 'Account banned');
    }

    // Return user data (NextAuth will handle session creation via credentials provider)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    };
  } catch (error) {
    apiLogger.error({ error }, 'signInEmail failed');
    return null;
  }
}

/**
 * Send verification OTP
 * Compatible with BetterAuth's sendVerificationOTP method
 */
export async function sendVerificationOTP(params: {
  body: {
    email: string;
    type: 'sign-in' | 'email-verification' | 'password-reset';
  };
  headers: Headers;
}) {
  try {
    const { email, type } = params.body;

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.verification.create({
      data: {
        identifier: email,
        value: otp,
        expiresAt: expiresAt,
      },
    });

    // TODO: Send email with OTP using your email service
    // For now, just log it (in production, use your email service)
    apiLogger.info({ email, otp, type }, 'OTP generated (implement email sending)');

    // In development, you might want to return the OTP for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    return { success: true };
  } catch (error) {
    apiLogger.error({ error }, 'sendVerificationOTP failed');
    return null;
  }
}

/**
 * Verify OTP code
 * Compatible with BetterAuth's checkVerificationOTP method
 */
export async function checkVerificationOTP(params: {
  body: {
    email: string;
    type: 'sign-in' | 'email-verification' | 'password-reset';
    otp: string;
  };
  headers: Headers;
}) {
  try {
    const { email, otp } = params.body;

    // Find valid OTP
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: email,
        value: otp,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!verification) {
      return null;
    }

    // Delete used OTP
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    return { success: true };
  } catch (error) {
    apiLogger.error({ error }, 'checkVerificationOTP failed');
    return null;
  }
}

/**
 * Get current session
 * Compatible with BetterAuth's getSession method
 */
export async function getSession(params: {
  headers: Headers;
}) {
  try {
    // In NextAuth v5, session is handled differently
    // This is a placeholder - actual implementation depends on how you're using sessions
    // You might need to extract the session token from cookies/headers
    return null;
  } catch (error) {
    apiLogger.error({ error }, 'getSession failed');
    return null;
  }
}

/**
 * Create impersonation session
 * Compatible with BetterAuth's impersonate method
 */
export async function createImpersonationSession(params: {
  body: {
    userId: string;
    impersonatorId: string;
  };
  headers: Headers;
}) {
  try {
    const { userId, impersonatorId } = params.body;

    // Get user to impersonate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      return null;
    }

    // Log impersonation start
    await prisma.auditLog.create({
      data: {
        userId: impersonatorId,
        action: 'IMPERSONATION_START',
        entityType: 'User',
        entityId: userId,
        details: {
          targetUser: user.email,
          targetTenant: user.tenant?.name,
        },
        ipAddress: 'system',
        userAgent: 'admin-portal',
      },
    });

    // Return user data for session creation
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      impersonating: true,
      impersonatorId,
    };
  } catch (error) {
    apiLogger.error({ error }, 'createImpersonationSession failed');
    return null;
  }
}

/**
 * Update user password
 * Compatible with BetterAuth's updatePassword method
 */
export async function updatePassword(params: {
  body: {
    userId: string;
    newPassword: string;
  };
  headers: Headers;
}) {
  try {
    const { userId, newPassword } = params.body;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    apiLogger.error({ error }, 'updatePassword failed');
    return null;
  }
}

/**
 * Change user password with current password verification
 * Compatible with BetterAuth's changePassword method
 */
export async function changePassword(params: {
  body: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  };
  headers: Headers;
}) {
  try {
    const { currentPassword, newPassword, revokeOtherSessions } = params.body;

    // Get session to identify user
    const session = await getSession({ headers: params.headers });
    if (!session?.user) {
      apiLogger.warn('changePassword: No active session');
      return null;
    }

    const userId = (session.user as any).id;

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      apiLogger.warn({ userId }, 'changePassword: User not found or no password set');
      return null;
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      apiLogger.warn({ userId }, 'changePassword: Invalid current password');
      return null;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // TODO: Implement session revocation if revokeOtherSessions is true
    if (revokeOtherSessions) {
      apiLogger.info({ userId }, 'changePassword: revokeOtherSessions requested (not yet implemented)');
    }

    return { success: true };
  } catch (error) {
    apiLogger.error({ error }, 'changePassword failed');
    return null;
  }
}

/**
 * List user sessions
 * Compatible with BetterAuth's listSessions method
 */
export async function listUserSessions(params: {
  body: {
    userId: string;
  };
  headers: Headers;
}) {
  try {
    const { userId } = params.body;

    // Get user sessions from NextAuth Session table
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { expires: 'desc' },
    });

    return sessions;
  } catch (error) {
    apiLogger.error({ error }, 'listUserSessions failed');
    return [];
  }
}

/**
 * Revoke user session
 * Compatible with BetterAuth's revokeSession method
 */
export async function revokeSession(params: {
  body: {
    sessionId: string;
  };
  headers: Headers;
}) {
  try {
    const { sessionId } = params.body;

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { success: true };
  } catch (error) {
    apiLogger.error({ error }, 'revokeSession failed');
    return null;
  }
}

/**
 * Auth API compatibility object
 * Provides BetterAuth-style API that routes were expecting
 */
export const authApi = {
  signInEmail,
  sendVerificationOTP,
  checkVerificationOTP,
  getSession,
  impersonate: createImpersonationSession,
  updatePassword,
  changePassword,
  listSessions: listUserSessions,
  revokeSession,
};

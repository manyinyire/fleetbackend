import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

interface SecuritySettings {
  require2FA: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  ipWhitelist: string[];
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  accountLockoutThreshold: number;
  accountLockoutDuration: number;
  allowedDomains: string[];
  maintenance: {
    enabled: boolean;
    message: string;
    allowedIPs: string[];
  };
}

// Default security settings
const DEFAULT_SETTINGS: SecuritySettings = {
  require2FA: false,
  sessionTimeout: 3600000, // 1 hour in ms
  maxConcurrentSessions: 3,
  ipWhitelist: [],
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  accountLockoutThreshold: 5,
  accountLockoutDuration: 900000, // 15 minutes in ms
  allowedDomains: [],
  maintenance: {
    enabled: false,
    message: 'System is under maintenance. Please check back later.',
    allowedIPs: [],
  },
};

export async function GET(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    // Get security settings from database
    const settings = await prisma.platformSettings.findFirst();

    let securitySettings = DEFAULT_SETTINGS;
    if (settings) {
      // Map PlatformSettings fields to security settings
      securitySettings = {
        ...DEFAULT_SETTINGS,
        accountLockoutThreshold: settings.failedLoginAttempts,
        maintenance: {
          ...DEFAULT_SETTINGS.maintenance,
          enabled: settings.maintenanceMode,
        },
      };
    }

    // Get security statistics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      failedLogins24h,
      failedLogins7d,
      activeSessions,
      bannedUsers,
      recentSecurityEvents,
    ] = await Promise.all([
      // Failed logins in last 24 hours
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: { gte: last24h },
        },
      }),
      // Failed logins in last 7 days
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: { gte: last7d },
        },
      }),
      // Active sessions
      prisma.session.count({
        where: {
          expiresAt: { gt: now },
        },
      }),
      // Banned users
      prisma.user.count({
        where: {
          banned: true,
        },
      }),
      // Recent security events
      prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'LOGIN_FAILED',
              'ACCOUNT_LOCKED',
              'PASSWORD_CHANGED',
              'ADMIN_IMPERSONATION_START',
              'USER_BANNED',
            ],
          },
          createdAt: { gte: last24h },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        settings: securitySettings,
        statistics: {
          failedLogins24h,
          failedLogins7d,
          activeSessions,
          bannedUsers,
        },
        recentEvents: recentSecurityEvents,
      },
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Security settings error:');
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole('SUPER_ADMIN');
    const data = await request.json();

    // Validate settings
    if (data.sessionTimeout && (data.sessionTimeout < 300000 || data.sessionTimeout > 86400000)) {
      return NextResponse.json(
        { success: false, error: 'Session timeout must be between 5 minutes and 24 hours' },
        { status: 400 }
      );
    }

    if (data.passwordMinLength && (data.passwordMinLength < 6 || data.passwordMinLength > 32)) {
      return NextResponse.json(
        { success: false, error: 'Password minimum length must be between 6 and 32 characters' },
        { status: 400 }
      );
    }

    // Get current settings
    const currentSettings = await prisma.platformSettings.findFirst();

    // Map security settings to PlatformSettings fields
    const updateData: any = {};
    if (data.accountLockoutThreshold !== undefined) {
      updateData.failedLoginAttempts = data.accountLockoutThreshold;
    }
    if (data.maintenance?.enabled !== undefined) {
      updateData.maintenanceMode = data.maintenance.enabled;
    }
    if (data.requireEmailVerification !== undefined) {
      updateData.requireEmailVerification = data.requireEmailVerification;
    }

    // Upsert settings
    const updated = await prisma.platformSettings.upsert({
      where: {
        id: currentSettings?.id || 'new-platform-settings',
      },
      update: updateData,
      create: {
        ...updateData,
        platformName: 'Azaire Fleet Manager',
        platformUrl: 'https://azaire.com',
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SECURITY_SETTINGS_UPDATED',
        entityType: 'PlatformSettings',
        entityId: updated.id,
        oldValues: currentSettings || {},
        newValues: data,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        settings: data,
      },
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Security settings update error:');
    return NextResponse.json(
      { success: false, error: 'Failed to update security settings' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    // Get admin settings
    const adminSettings = await prisma.adminSettings.findFirst({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get platform settings from database
    let platformSettings = await prisma.platformSettings.findFirst();
    
    // If no platform settings exist, create default ones
    if (!platformSettings) {
      platformSettings = await prisma.platformSettings.create({
        data: {
          id: 'default-platform-settings',
          platformName: process.env.PLATFORM_NAME || 'Azaire Fleet Manager',
          platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://azaire.com',
          defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Africa/Harare',
          defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
          allowSignups: true,
          requireEmailVerification: true,
          requireAdminApproval: false,
          enableTrials: true,
          trialDuration: 30,
          requirePaymentUpfront: true,
          failedLoginAttempts: 5,
          emailNotifications: true,
          smsNotifications: false,
          webhookUrl: process.env.WEBHOOK_URL || null,
          alertFrequency: 'immediate',
          maintenanceMode: false,
        },
      });
    }

    // Combine platform settings with admin settings
    const settings = {
      platformName: platformSettings.platformName,
      platformUrl: platformSettings.platformUrl,
      platformLogo: platformSettings.platformLogo || "",
      platformAddress: platformSettings.platformAddress || "",
      platformEmail: platformSettings.platformEmail || "",
      defaultTimezone: platformSettings.defaultTimezone,
      defaultCurrency: platformSettings.defaultCurrency,
      allowSignups: platformSettings.allowSignups,
      requireEmailVerification: platformSettings.requireEmailVerification,
      requireAdminApproval: platformSettings.requireAdminApproval,
      enableTrials: platformSettings.enableTrials,
      trialDuration: platformSettings.trialDuration,
      requirePaymentUpfront: platformSettings.requirePaymentUpfront,
      force2FA: adminSettings?.twoFactorEnabled || false,
      sessionTimeout: adminSettings?.sessionTimeout || 30,
      enableIPWhitelist: adminSettings?.ipWhitelistEnabled || false,
      failedLoginAttempts: platformSettings.failedLoginAttempts,
      emailNotifications: platformSettings.emailNotifications,
      smsNotifications: platformSettings.smsNotifications,
      webhookUrl: platformSettings.webhookUrl || "",
      alertFrequency: platformSettings.alertFrequency,
      maintenanceMode: platformSettings.maintenanceMode
    };

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole('SUPER_ADMIN');
    const data = await request.json();

    // Separate platform settings from admin settings
    const platformSettingsFields = [
      'platformName',
      'platformUrl',
      'platformLogo',
      'platformAddress',
      'platformEmail',
      'defaultTimezone',
      'defaultCurrency',
      'allowSignups',
      'requireEmailVerification',
      'requireAdminApproval',
      'enableTrials',
      'trialDuration',
      'requirePaymentUpfront',
      'failedLoginAttempts',
      'emailNotifications',
      'smsNotifications',
      'webhookUrl',
      'alertFrequency',
      'maintenanceMode'
    ];

    const adminSettingsFields = ['force2FA', 'sessionTimeout', 'enableIPWhitelist'];

    // Update platform settings
    const platformData: any = {};
    platformSettingsFields.forEach(field => {
      if (data[field] !== undefined) {
        platformData[field] = data[field];
      }
    });

    if (Object.keys(platformData).length > 0) {
      // Get or create platform settings
      let platformSettings = await prisma.platformSettings.findFirst();
      
      if (platformSettings) {
        await prisma.platformSettings.update({
          where: { id: platformSettings.id },
          data: platformData
        });
      } else {
        await prisma.platformSettings.create({
          data: {
            id: 'default-platform-settings',
            ...platformData
          }
        });
      }
    }

    // Update admin settings (user-specific)
    const adminData: any = {};
    if (data.force2FA !== undefined) {
      adminData.twoFactorEnabled = data.force2FA;
    }
    if (data.sessionTimeout !== undefined) {
      adminData.sessionTimeout = data.sessionTimeout;
    }
    if (data.enableIPWhitelist !== undefined) {
      adminData.ipWhitelistEnabled = data.enableIPWhitelist;
    }

    if (Object.keys(adminData).length > 0) {
      await prisma.adminSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          twoFactorEnabled: adminData.twoFactorEnabled ?? false,
          sessionTimeout: adminData.sessionTimeout ?? 30,
          ipWhitelistEnabled: adminData.ipWhitelistEnabled ?? false
        },
        update: adminData
      });
    }

    // Log the settings update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SETTINGS_UPDATED',
        entityType: 'Settings',
        newValues: data,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


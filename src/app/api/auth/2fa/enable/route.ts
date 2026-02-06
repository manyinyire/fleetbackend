import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTwoFactorSecret, hashBackupCode } from '@/lib/two-factor';
import { apiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if 2FA is already enabled
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });

    if (user?.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      );
    }

    // Generate 2FA secret, QR code, and backup codes
    const { secret, qrCode, backupCodes } = await generateTwoFactorSecret(
      session.user.email
    );

    // Hash backup codes for storage
    const hashedBackupCodes = backupCodes.map(hashBackupCode);
    
    // Store secret (2FA not enabled yet - requires verification)
    // Note: Backup codes should be stored separately or in a JSON field
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        // TODO: Add backupCodes field to User model if needed
      }
    });

    apiLogger.info({ userId: session.user.id }, '2FA setup initiated');

    return NextResponse.json({ 
      message: 'Scan the QR code with your authenticator app',
      qrCode,
      secret, // Show secret for manual entry
      backupCodes, // Show once, user must save these
    });
  } catch (error) {
    apiLogger.error({ error }, 'Enable 2FA error');
    return NextResponse.json(
      { error: 'Failed to enable two-factor authentication' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTwoFactorToken } from '@/lib/two-factor';
import { apiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token || token.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // Get user's 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Two-factor authentication not set up' },
        { status: 400 }
      );
    }

    // Verify the token
    const verification = verifyTwoFactorToken(token, user.twoFactorSecret);

    if (!verification.isValid) {
      apiLogger.warn({ userId: session.user.id }, '2FA verification failed');
      return NextResponse.json(
        { error: verification.error || 'Invalid token' },
        { status: 400 }
      );
    }

    // Enable 2FA if this is the first verification
    if (!user.twoFactorEnabled) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
      });

      apiLogger.info({ userId: session.user.id }, '2FA enabled successfully');
    }

    return NextResponse.json({ 
      success: true,
      message: '2FA verified successfully',
    });
  } catch (error) {
    apiLogger.error({ error }, 'Verify 2FA error');
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}

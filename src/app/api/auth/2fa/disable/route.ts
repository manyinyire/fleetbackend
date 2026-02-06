import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTwoFactorToken } from '@/lib/two-factor';
import bcrypt from 'bcryptjs';
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

    const { password, token } = await request.json();

    // Get user with password and 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        password: true, 
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    if (!user.password || !password) {
      return NextResponse.json(
        { error: 'Password verification required' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      apiLogger.warn({ userId: session.user.id }, '2FA disable failed: invalid password');
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Verify 2FA token if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!token) {
        return NextResponse.json(
          { error: '2FA token required' },
          { status: 400 }
        );
      }

      const verification = verifyTwoFactorToken(token, user.twoFactorSecret);
      if (!verification.isValid) {
        apiLogger.warn({ userId: session.user.id }, '2FA disable failed: invalid token');
        return NextResponse.json(
          { error: 'Invalid 2FA token' },
          { status: 401 }
        );
      }
    }

    // Disable 2FA and clear secrets
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      }
    });

    apiLogger.info({ userId: session.user.id }, '2FA disabled successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Two-factor authentication disabled' 
    });
  } catch (error) {
    apiLogger.error({ error }, 'Disable 2FA error');
    return NextResponse.json(
      { error: 'Failed to disable two-factor authentication' },
      { status: 500 }
    );
  }
}
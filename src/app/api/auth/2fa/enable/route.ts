import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate a secret (stored but not used for email OTP - kept for compatibility)
    const secret = randomBytes(20).toString('base32');
    
    // Enable 2FA in user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret
      }
    });

    return NextResponse.json({ 
      message: 'Two-factor authentication enabled',
      secret: secret 
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
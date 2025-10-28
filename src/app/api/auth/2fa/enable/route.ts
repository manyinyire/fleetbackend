import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp-service';
import { auth } from '@/lib/auth';

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

    const result = await otpService.enableTwoFactor(session.user.id);

    if (result.success) {
      return NextResponse.json({ 
        message: 'Two-factor authentication enabled',
        secret: result.secret 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to enable two-factor authentication' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
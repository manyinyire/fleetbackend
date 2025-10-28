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

    const success = await otpService.sendTwoFactorOTP(session.user.id);

    if (success) {
      return NextResponse.json({ message: 'OTP sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send OTP' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send 2FA OTP error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
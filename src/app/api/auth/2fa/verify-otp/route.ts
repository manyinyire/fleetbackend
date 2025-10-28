import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp-service';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'OTP code is required' },
        { status: 400 }
      );
    }

    const isValid = await otpService.verifyTwoFactorOTP(code, session.user.id);

    if (isValid) {
      return NextResponse.json({ message: 'OTP verified successfully' });
    } else {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Verify 2FA OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
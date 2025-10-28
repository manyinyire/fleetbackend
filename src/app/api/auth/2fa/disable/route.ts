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

    const success = await otpService.disableTwoFactor(session.user.id);

    if (success) {
      return NextResponse.json({ message: 'Two-factor authentication disabled' });
    } else {
      return NextResponse.json(
        { error: 'Failed to disable two-factor authentication' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
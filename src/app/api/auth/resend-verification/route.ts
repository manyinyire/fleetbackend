import { NextRequest, NextResponse } from 'next/server';
import { emailVerificationService } from '@/lib/email-verification';
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

    const success = await emailVerificationService.sendEmailVerification(session.user.id);

    if (success) {
      return NextResponse.json({ message: 'Verification email sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
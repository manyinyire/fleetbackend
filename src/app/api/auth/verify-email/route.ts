import { NextRequest, NextResponse } from 'next/server';
import { emailVerificationService } from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await emailVerificationService.verifyEmail(token);

    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await emailVerificationService.verifyEmail(token);

    if (result.success) {
      // Redirect to success page
      return NextResponse.redirect(new URL('/auth/email-verified', request.url));
    } else {
      // Redirect to error page
      return NextResponse.redirect(new URL('/auth/verification-failed', request.url));
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth/verification-failed', request.url));
  }
}
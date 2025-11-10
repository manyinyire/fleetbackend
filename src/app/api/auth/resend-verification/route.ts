import { NextRequest, NextResponse } from 'next/server';
import { emailVerificationService } from '@/lib/email-verification';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get email from request body
    const body = await request.json();
    const email = body.email;

    // Try to get session for logged-in users
    let userId: string | undefined;

    if (email) {
      // Find user by email (works for both logged-in and non-logged-in users)
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      userId = user.id;
    } else {
      // If no email provided, try to get from session
      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Email or authentication required' },
          { status: 401 }
        );
      }

      userId = session.user.id;
    }

    const success = await emailVerificationService.sendEmailVerification(userId);

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
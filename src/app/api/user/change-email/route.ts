import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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

    const { newEmail, password } = await request.json();

    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'New email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: 'Password verification required' },
        { status: 400 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      apiLogger.warn({ userId: session.user.id }, 'Email change failed: invalid password');
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already in use' },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification request
    // Note: Using Verification model as EmailVerification might not have all fields
    await prisma.verification.create({
      data: {
        identifier: newEmail,
        value: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    const { sendEmail } = await import('@/lib/email');
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/user/verify-email-change?token=${verificationToken}`;
    
    await sendEmail({
      to: newEmail,
      subject: 'Verify Your New Email Address',
      html: `
        <h1>Verify Your New Email Address</h1>
        <p>You requested to change your email address. Click the link below to verify your new email:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this change, please ignore this email.</p>
      `,
      text: `Verify your new email address: ${verificationUrl}`,
    });

    apiLogger.info({ userId: session.user.id, newEmail }, 'Email change verification sent');

    return NextResponse.json({
      success: true,
      message: 'Verification email sent to new address',
    });
  } catch (error) {
    apiLogger.error({ error }, 'Change email error');
    return NextResponse.json(
      { error: 'Failed to change email' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberDevice, otp } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists and is a super admin
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // If OTP is provided, verify both password and OTP, then complete login
      if (otp) {
        // Verify password again (security: ensure password is still correct)
        const passwordCheck = await auth.api.signInEmail({
          body: {
            email,
            password,
          },
          headers: request.headers
        });

        if (!passwordCheck) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        }

        // Verify OTP using BetterAuth
        const otpCheck = await auth.api.checkVerificationOTP({
          body: {
            email,
            type: 'sign-in',
            otp,
          },
          headers: request.headers
        });

        if (!otpCheck) {
          return NextResponse.json(
            { error: 'Invalid or expired OTP code' },
            { status: 401 }
          );
        }

        // Both password and OTP verified - create session using password login
        // (signInEmailOTP doesn't require password, so we use regular signInEmail)
        const session = await auth.api.signInEmail({
          body: {
            email,
            password,
            callbackURL: '/superadmin/dashboard'
          },
          headers: request.headers
        });

        if (!session) {
          return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
          );
        }

        // Log successful login with 2FA
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN',
            entityType: 'Super Admin Portal',
            entityId: user.id,
            newValues: { 
              email: user.email,
              rememberDevice: rememberDevice || false,
              twoFactorUsed: true,
              timestamp: new Date().toISOString()
            },
            ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          message: 'Login successful'
        });
      } else {
        // 2FA enabled but no OTP provided - verify password first, then send OTP
        // Verify password using BetterAuth
        const passwordCheck = await auth.api.signInEmail({
          body: {
            email,
            password,
          },
          headers: request.headers
        });

        if (!passwordCheck) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        }

        // Password verified, send OTP
        await auth.api.sendVerificationOTP({
          body: {
            email,
            type: 'sign-in',
          },
          headers: request.headers
        });

        return NextResponse.json({
          success: true,
          requires2FA: true,
          message: 'Two-factor authentication required. OTP sent to your email.'
        });
      }
    } else {
      // No 2FA - regular login with password
      const session = await auth.api.signInEmail({
        body: {
          email,
          password,
          callbackURL: '/superadmin/dashboard'
        },
        headers: request.headers
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Log the login attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entityType: 'Super Admin Portal',
          entityId: user.id,
          newValues: { 
            email: user.email,
            rememberDevice: rememberDevice || false,
            timestamp: new Date().toISOString()
          },
          ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        message: 'Login successful'
      });
    }

  } catch (error: any) {
    console.error('Super Admin login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
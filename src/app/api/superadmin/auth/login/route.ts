import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberDevice } = await request.json();

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

    // For now, we'll use BetterAuth for password verification
    // In a real implementation, you'd verify the password here
    // and then create a session with BetterAuth
    
    // Create session using BetterAuth
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

  } catch (error) {
    console.error('Super Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
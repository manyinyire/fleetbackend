import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPostHandler } from '@/middleware/api-middleware';
import { loginSchema } from '@/lib/api-schemas';
import { ApiErrors } from '@/lib/api-error';
import { logAuthEvent } from '@/lib/logger';

export const POST = createPostHandler(
  {
    auth: 'none',
    validate: { body: loginSchema },
    rateLimit: true,
  },
  async (request, context) => {
    const { email, password, rememberDevice } = context.body;

    // Check if user exists and is a super admin
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      logAuthEvent('failed_login', undefined, { email, reason: 'invalid_credentials' });
      throw ApiErrors.unauthorized();
    }

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
      logAuthEvent('failed_login', user.id, { email, reason: 'auth_failed' });
      throw ApiErrors.unauthorized();
    }

    // Log the successful login
    logAuthEvent('login', user.id, {
      email: user.email,
      rememberDevice: rememberDevice || false,
    });

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
);
import { NextRequest, NextResponse } from 'next/server';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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

    const { password, confirmation } = await request.json();

    if (!password || confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Password and confirmation required' },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        password: true, 
        email: true,
        tenantId: true,
        role: true,
      },
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
      apiLogger.warn({ userId: session.user.id }, 'Account deletion failed: invalid password');
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Prevent deletion if user is the only admin of a tenant
    if (user.tenantId && user.role?.includes('TENANT_ADMIN')) {
      const adminCount = await prisma.user.count({
        where: {
          tenantId: user.tenantId,
          role: {
            contains: 'TENANT_ADMIN',
          },
        },
      });

      if (adminCount === 1) {
        return NextResponse.json(
          { error: 'Cannot delete account. You are the only admin of your organization.' },
          { status: 400 }
        );
      }
    }

    // Log account deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ACCOUNT_DELETED',
        entityType: 'User',
        entityId: session.user.id,
        details: {
          email: user.email,
          deletedAt: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Delete user (cascade will handle related records based on schema)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    apiLogger.info({ userId: session.user.id, email: user.email }, 'Account deleted');

    // Sign out user
    await signOut();

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    apiLogger.error({ error }, 'Delete account error');
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

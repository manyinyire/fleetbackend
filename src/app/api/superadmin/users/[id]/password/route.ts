import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireRole('SUPER_ADMIN');
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Use BetterAuth admin plugin to set user password
    const headersList = await headers();
    await auth.api.setUserPassword({
      body: {
        userId: params.id,
        newPassword,
      },
      headers: headersList,
    });

    // Log the password change
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_PASSWORD_CHANGED',
        entityType: 'User',
        entityId: params.id,
        newValues: {
          changedAt: new Date().toISOString()
        },
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User password updated successfully'
    });
  } catch (error: any) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user password' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


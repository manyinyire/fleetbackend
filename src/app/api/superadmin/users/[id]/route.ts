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
    const data = await request.json();

    // Use BetterAuth admin plugin to update user
    const headersList = await headers();
    const updatedUser = await auth.api.adminUpdateUser({
      body: {
        userId: params.id,
        data,
      },
      headers: headersList,
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: params.id,
        newValues: data,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireRole('SUPER_ADMIN');

    // Use BetterAuth admin plugin to remove user
    const headersList = await headers();
    await auth.api.removeUser({
      body: {
        userId: params.id,
      },
      headers: headersList,
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: params.id,
        newValues: {
          deletedAt: new Date().toISOString()
        },
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


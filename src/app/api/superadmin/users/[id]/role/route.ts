import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminUser = await requireRole('SUPER_ADMIN');
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    // Use BetterAuth admin plugin to set user role
    const headersList = await headers();
    await auth.api.setRole({
      body: {
        userId: id,
        role: Array.isArray(role) ? role : [role],
      },
      headers: headersList,
    });

    // Log the role change
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_ROLE_CHANGED',
        entityType: 'User',
        entityId: id,
        newValues: {
          role: Array.isArray(role) ? role.join(',') : role,
          changedAt: new Date().toISOString()
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error: any) {
    console.error('Set role error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


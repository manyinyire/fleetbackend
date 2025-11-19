import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminUser = await requireRole('SUPER_ADMIN');
    const data = await request.json();

    // Update user directly in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: id,
        newValues: data,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
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
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminUser = await requireRole('SUPER_ADMIN');

    // Get user info before deletion for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true, role: true },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Clear all sessions for this user BEFORE deletion to prevent cached data
    const sessionsCleared = await prisma.session.deleteMany({
      where: { userId: id },
    });

    console.log(`Cleared ${sessionsCleared.count} session(s) for user ${userToDelete.email}`);

    // Delete user from database
    await prisma.user.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: id,
        newValues: {
          deletedAt: new Date().toISOString(),
          userEmail: userToDelete.email,
          userName: userToDelete.name,
          sessionsCleared: sessionsCleared.count,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      sessionsCleared: sessionsCleared.count,
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  } finally {
  }
}


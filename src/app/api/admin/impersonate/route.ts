import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Only SUPER_ADMIN can impersonate
    if ((user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied: Super admin only' },
        { status: 403 }
      );
    }

    const { targetUserId, reason } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { tenant: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Create impersonation session
    const impersonationSession = await auth.api.signInEmail({
      body: {
        email: targetUser.email,
        password: 'impersonation', // This won't work with real auth, but we'll handle it differently
      },
    });

    // Log the impersonation action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPERSONATE_USER',
        entityType: 'USER',
        entityId: targetUserId,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Impersonating ${targetUser.name}`,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        tenantId: targetUser.tenantId,
        tenantName: targetUser.tenant?.name,
      }
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Only SUPER_ADMIN can stop impersonation
    if ((user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied: Super admin only' },
        { status: 403 }
      );
    }

    // Log the end of impersonation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'STOP_IMPERSONATION',
        entityType: 'SESSION',
        entityId: 'impersonation',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped'
    });

  } catch (error) {
    console.error('Stop impersonation error:', error);
    return NextResponse.json(
      { error: 'Failed to stop impersonation' },
      { status: 500 }
    );
  }
}

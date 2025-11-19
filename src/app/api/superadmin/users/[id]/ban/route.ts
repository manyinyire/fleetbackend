import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminUser = await requireRole('SUPER_ADMIN');
    const { banReason, banExpiresIn } = await request.json();

    // Ban user by updating the database directly
    const banExpires = banExpiresIn ? new Date(Date.now() + parseInt(banExpiresIn) * 1000) : null;
    
    await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: banReason || 'No reason provided',
        banExpires: banExpires,
      },
    });

    // Log the ban action
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_BANNED',
        entityType: 'User',
        entityId: id,
        newValues: {
          banReason: banReason || 'No reason provided',
          banExpiresIn: banExpiresIn || null,
          bannedAt: new Date().toISOString()
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error: any) {
    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to ban user' },
      { status: 500 }
    );
  } finally {
  }
}


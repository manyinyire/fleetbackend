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

    // Use BetterAuth admin plugin to unban user
    const headersList = await headers();
    await auth.api.unbanUser({
      body: {
        userId: id,
      },
      headers: headersList,
    });

    // Log the unban action
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_UNBANNED',
        entityType: 'User',
        entityId: id,
        newValues: {
          unbannedAt: new Date().toISOString()
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error: any) {
    console.error('Unban user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unban user' },
      { status: 500 }
    );
  } finally {
  }
}


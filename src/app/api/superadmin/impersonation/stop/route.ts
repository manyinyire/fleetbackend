import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';


export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if currently impersonating
    const impersonatorId = (session.user as any).impersonatorId;
    
    if (!impersonatorId) {
      return NextResponse.json(
        { error: 'Not currently impersonating' },
        { status: 400 }
      );
    }

    // Get impersonator user
    const impersonator = await prisma.user.findUnique({
      where: { id: impersonatorId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!impersonator) {
      return NextResponse.json(
        { error: 'Impersonator user not found' },
        { status: 404 }
      );
    }

    // Log impersonation stop
    await prisma.auditLog.create({
      data: {
        userId: impersonatorId,
        action: 'IMPERSONATION_STOP',
        entityType: 'User',
        entityId: session.user.id,
        details: {
          impersonatedUser: session.user.email,
          impersonatorId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    apiLogger.info({
      impersonatorId,
      impersonatedUserId: session.user.id,
    }, 'Impersonation stopped');

    // Return impersonator data to restore session
    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped',
      user: impersonator,
    });
  } catch (error: any) {
    apiLogger.error({ err: error }, 'Stop impersonation error');
    return NextResponse.json(
      { error: error.message || 'Failed to stop impersonation' },
      { status: 500 }
    );
  }
}


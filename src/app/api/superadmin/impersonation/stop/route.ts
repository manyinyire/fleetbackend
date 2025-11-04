import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('SUPER_ADMIN');
    
    // Get current session to check if impersonating
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    // Use BetterAuth admin plugin to stop impersonation
    await auth.api.stopImpersonating({
      headers: headersList,
    });

    // Log the end of impersonation if we have session info
    if (session?.user) {
      // Try to get impersonated session info from database
      const impersonatedSession = await prisma.session.findFirst({
        where: {
          userId: session.user.id,
          impersonatedBy: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (impersonatedSession?.impersonatedBy) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'IMPERSONATION_STOPPED',
            entityType: 'User',
            entityId: session.user.id,
            newValues: {
              stoppedAt: new Date().toISOString()
            },
            ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped'
    });
  } catch (error: any) {
    console.error('Stop impersonation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop impersonation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { clearOrphanedSessions, clearExpiredSessions } from '@/lib/clear-user-cache';
import { apiLogger } from '@/lib/logger';

/**
 * Maintenance endpoint to clean up sessions
 * GET: Get statistics about sessions
 * POST: Clean up orphaned and expired sessions
 */

export async function GET(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    const { prisma } = await import('@/lib/prisma');

    // Get session statistics
    const totalSessions = await prisma.session.count();
    const expiredSessions = await prisma.session.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Check for orphaned sessions using safe $queryRaw
    const orphanedSessions = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "sessions" s
      LEFT JOIN "users" u ON s."userId" = u.id
      WHERE u.id IS NULL
    `;

    const orphanedCount = Number(orphanedSessions[0]?.count || 0);

    return NextResponse.json({
      success: true,
      statistics: {
        total: totalSessions,
        expired: expiredSessions,
        orphaned: orphanedCount,
        active: totalSessions - expiredSessions - orphanedCount,
      },
    });
  } catch (error: any) {
    apiLogger.error({ err: error }, 'Get session statistics error:');
    return NextResponse.json(
      { error: error.message || 'Failed to get session statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    const body = await request.json();
    const { cleanOrphaned = true, cleanExpired = true } = body;

    let orphanedCleaned = 0;
    let expiredCleaned = 0;

    if (cleanOrphaned) {
      orphanedCleaned = await clearOrphanedSessions();
    }

    if (cleanExpired) {
      expiredCleaned = await clearExpiredSessions();
    }

    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      cleaned: {
        orphaned: orphanedCleaned,
        expired: expiredCleaned,
        total: orphanedCleaned + expiredCleaned,
      },
    });
  } catch (error: any) {
    apiLogger.error({ err: error }, 'Clean sessions error:');
    return NextResponse.json(
      { error: error.message || 'Failed to clean sessions' },
      { status: 500 }
    );
  }
}


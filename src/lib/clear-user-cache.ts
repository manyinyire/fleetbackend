/**
 * Utility to clear user session cache
 * Use this when a user is deleted or updated to force refresh of cached data
 */

import { prisma } from './prisma';
import { authLogger } from './logger';

/**
 * Clear all sessions for a specific user
 * This forces the user to re-authenticate and clears any cached data
 */
export async function clearUserSessions(userId: string): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: { userId },
    });

    authLogger.info({ userId, count: result.count }, 'Cleared user sessions');
    return result.count;
  } catch (error) {
    authLogger.error({ err: error, userId }, 'Failed to clear user sessions');
    throw error;
  }
}

/**
 * Clear all orphaned sessions (sessions for users that no longer exist)
 * Run this periodically or after deleting users
 */
export async function clearOrphanedSessions(): Promise<number> {
  try {
    // Find sessions where the user no longer exists - using safe $queryRaw
    const orphanedSessions = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT s.id
      FROM "sessions" s
      LEFT JOIN "users" u ON s."userId" = u.id
      WHERE u.id IS NULL
    `;

    if (orphanedSessions.length === 0) {
      authLogger.info('No orphaned sessions found');
      return 0;
    }

    // Delete orphaned sessions
    const result = await prisma.session.deleteMany({
      where: {
        id: {
          in: orphanedSessions.map(s => s.id),
        },
      },
    });

    authLogger.info({ count: result.count }, 'Cleared orphaned sessions');
    return result.count;
  } catch (error) {
    authLogger.error({ err: error }, 'Failed to clear orphaned sessions');
    throw error;
  }
}

/**
 * Clear all expired sessions
 * Run this periodically to clean up old sessions
 */
export async function clearExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    authLogger.info({ count: result.count }, 'Cleared expired sessions');
    return result.count;
  } catch (error) {
    authLogger.error({ err: error }, 'Failed to clear expired sessions');
    throw error;
  }
}


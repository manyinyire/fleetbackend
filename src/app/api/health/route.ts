import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';

/**
 * Health check endpoint
 * GET /api/health
 *
 * This endpoint is used by PM2, Nginx, and monitoring tools
 * to check if the application is running and healthy.
 *
 * Uses the shared Prisma client to avoid connection pool exhaustion.
 */
export async function GET() {
  try {
    // Check database connection using shared client
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    apiLogger.error({ error }, 'Health check failed');

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}


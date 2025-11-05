import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { withErrorHandler, parsePaginationParams, paginatedResponse, calculateSkip, buildOrderBy } from '@/lib/api';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().optional(),
  tenantId: z.string().cuid().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Require super admin role
  await requireRole('SUPER_ADMIN');

  const { searchParams } = new URL(request.url);

  // Parse pagination parameters
  const { page = 1, limit = 25, sortBy = 'createdAt', sortOrder = 'desc' } = parsePaginationParams(searchParams);
  const skip = calculateSkip(page, limit);

  // Parse filter parameters
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const tenantId = searchParams.get('tenantId') || '';

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  // Execute single query with all includes - NO N+1!
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          }
        },
        sessions: {
          select: {
            createdAt: true,
            expiresAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            sessions: true,
          }
        }
      },
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Transform users with calculated fields
  const usersWithMetrics = users.map(user => {
    const lastLogin = user.sessions[0]?.createdAt || null;
    const isActive = lastLogin && new Date(lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLogin,
      isActive,
      banned: user.banned,
      banReason: user.banReason,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name || 'No Tenant',
      tenantSlug: user.tenant?.slug || null,
      tenantStatus: user.tenant?.status || null,
      totalSessions: user._count.sessions,
    };
  });

  // Get summary statistics in parallel
  const [roleStats, activeUsersCount, bannedUsersCount] = await Promise.all([
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: where.OR ? undefined : where, // Apply same filters except search
    }),
    prisma.user.count({
      where: {
        ...where,
        sessions: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    }),
    prisma.user.count({
      where: {
        ...where,
        banned: true
      }
    })
  ]);

  logger.info({
    page,
    limit,
    total,
    filters: { search, role, tenantId }
  }, 'Fetched users list');

  return NextResponse.json({
    users: usersWithMetrics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    },
    summary: {
      total,
      active: activeUsersCount,
      banned: bannedUsersCount,
      byRole: roleStats.map(stat => ({
        role: stat.role || 'NO_ROLE',
        count: stat._count.role
      }))
    }
  });
}, 'superadmin-users:GET');

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Require super admin role
  await requireRole('SUPER_ADMIN');

  const body = await request.json();
  const validatedData = createUserSchema.parse(body);

  // Create user through better-auth would be ideal, but for now create directly
  const user = await prisma.user.create({
    data: {
      email: validatedData.email,
      name: validatedData.name,
      role: validatedData.role || 'USER',
      tenantId: validatedData.tenantId || null,
      emailVerified: false,
    },
  });

  logger.info({ userId: user.id, email: user.email }, 'User created by super admin');

  return NextResponse.json(user, { status: 201 });
}, 'superadmin-users:POST');

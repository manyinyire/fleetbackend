import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { PremiumFeatureService } from '@/lib/premium-features';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const tenantId = searchParams.get('tenantId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Tenant filter
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Get users with tenant information and metrics
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
              expiresAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              sessions: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const usersWithTenant = users;

    // Transform users with calculated fields
    const usersWithMetrics = usersWithTenant.map(user => {
      const lastLoginAt = user.sessions[0]?.createdAt || null;
      const isActive = lastLoginAt && new Date(lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt,
        isActive,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        tenantId: user.tenantId,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          status: user.tenant.status,
        } : null,
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

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithMetrics,
        stats: {
          total,
          active: activeUsersCount,
          superAdmins: roleStats.find(r => r.role === 'SUPER_ADMIN')?._count.role || 0,
          suspended: bannedUsersCount,
          roleDistribution: roleStats,
          activeUsers: activeUsersCount,
          bannedUsers: bannedUsersCount,
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Error fetching users');
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    const body = await request.json();
    const { tenantId, role, email, name } = body;

    // CRITICAL VALIDATION: All users except SUPER_ADMIN must have a tenantId
    // This enforces the multi-tenant architecture requirement
    const userRole = role || 'USER';
    if (userRole !== 'SUPER_ADMIN' && !tenantId) {
      return NextResponse.json(
        {
          error: 'Tenant ID is required for all users except SUPER_ADMIN',
          details: 'In this system, every user must belong to a tenant organization. ' +
            'Only SUPER_ADMIN users can exist without a tenant. ' +
            'Please provide a tenantId or set role to SUPER_ADMIN.',
        },
        { status: 400 }
      );
    }

    // Validate email and name are provided
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // If tenantId is provided, verify tenant exists
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return NextResponse.json(
          { error: `Tenant with ID ${tenantId} not found` },
          { status: 404 }
        );
      }

      // Check if tenant can add more users (premium feature check)
      const isAdmin = userRole === 'TENANT_ADMIN' || userRole === 'admin';
      const featureCheck = await PremiumFeatureService.canAddUser(tenantId, isAdmin);

      if (!featureCheck.allowed) {
        return NextResponse.json(
          {
            error: featureCheck.reason,
            currentUsage: featureCheck.currentUsage,
            limit: featureCheck.limit,
            suggestedPlan: featureCheck.suggestedPlan,
            upgradeMessage: featureCheck.upgradeMessage,
          },
          { status: 403 }
        );
      }
    }

    // Create user through better-auth would be ideal, but for now create directly
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: userRole,
        tenantId: tenantId || null,
        emailVerified: false,
      },
    });

    apiLogger.info({
      userId: user.id,
      email: user.email,
      role: userRole,
      tenantId: tenantId || null
    }, 'User created by super admin');

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    apiLogger.error({ err: error }, 'Error creating user');
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

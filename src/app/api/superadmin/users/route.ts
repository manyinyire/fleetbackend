import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Use BetterAuth admin plugin to list users
    const headersList = await headers();
    const usersResult = await auth.api.listUsers({
      query: {
        searchValue: search,
        searchField: search ? 'name' : undefined,
        searchOperator: 'contains',
        limit: limit.toString(),
        offset: offset.toString(),
        sortBy: sortBy === 'createdAt' ? undefined : sortBy, // BetterAuth may not support createdAt sorting
        sortDirection: sortOrder as 'asc' | 'desc',
        filterField: role ? 'role' : tenantId ? 'tenantId' : undefined,
        filterValue: role || tenantId || undefined,
        filterOperator: 'eq',
      },
      headers: headersList,
    });

    // Enhance with tenant information and additional metrics
    const usersWithTenant = await Promise.all(
      usersResult.users.map(async (user: any) => {
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            sessions: {
              select: {
                createdAt: true,
                expiresAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });

        const lastLogin = fullUser?.sessions[0]?.createdAt || null;
        const isActive = lastLogin && new Date(lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        return {
          ...user,
          lastLogin,
          isActive,
          tenantName: fullUser?.tenant?.name || 'No Tenant',
          tenantSlug: fullUser?.tenant?.slug || null,
          tenantId: fullUser?.tenantId || null
        };
      })
    );

    // Get summary statistics
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    // Calculate active users (logged in within last 7 days)
    const activeUsers = await prisma.user.count({
      where: {
        sessions: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithTenant,
        pagination: {
          page,
          limit,
          total: usersResult.total,
          pages: Math.ceil(usersResult.total / limit)
        },
        stats: {
          total: usersResult.total,
          active: activeUsers,
          superAdmins: roleStats.find(r => r.role === 'SUPER_ADMIN')?._count.role || 0,
          tenantAdmins: roleStats.find(r => r.role === 'TENANT_ADMIN')?._count.role || 0,
          fleetManagers: roleStats.find(r => r.role === 'FLEET_MANAGER')?._count.role || 0,
          drivers: roleStats.find(r => r.role === 'DRIVER')?._count.role || 0,
          regularUsers: roleStats.find(r => r.role === 'USER')?._count.role || 0
        }
      }
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin role
    const user = await requireRole('SUPER_ADMIN');

    const data = await request.json();
    const { name, email, password, role, tenantId } = data;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate tenant if provided
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 400 }
        );
      }
    }

    // Use BetterAuth admin plugin to create user
    const headersList = await headers();
    const newUser = await auth.api.createUser({
      body: {
        email,
        password,
        name,
        role: role || 'USER',
        data: {
          tenantId: tenantId || null
        }
      },
      headers: headersList,
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newUser.id,
        newValues: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          tenantId: tenantId || null
        },
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Get tenant info if exists
    const tenant = tenantId ? await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true }
    }) : null;

    return NextResponse.json({
      success: true,
      data: {
        ...newUser,
        tenantName: tenant?.name || 'No Tenant',
        tenantSlug: tenant?.slug || null,
        tenantId: tenantId || null
      }
    });

  } catch (error: any) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
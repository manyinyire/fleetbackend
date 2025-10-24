import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
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
    const status = searchParams.get('status') || '';
    const tenantId = searchParams.get('tenantId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Note: We don't have a status field in the User model yet
    // You might want to add one or implement status logic differently

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
      }),
      prisma.user.count({ where })
    ]);

    // Calculate additional metrics for each user
    const usersWithMetrics = users.map(user => {
      const lastLogin = user.sessions[0]?.createdAt || null;
      const isActive = lastLogin && new Date(lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return {
        ...user,
        lastLogin,
        isActive,
        tenantName: user.tenant?.name || 'No Tenant',
        tenantSlug: user.tenant?.slug || null
      };
    });

    // Get summary statistics
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    const tenantStats = await prisma.user.groupBy({
      by: ['tenantId'],
      _count: { tenantId: true }
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
        users: usersWithMetrics,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total: total,
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
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
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

    // Create user (password will be hashed by BetterAuth)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // This should be hashed before saving
        role,
        tenantId: tenantId || null
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
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
          tenantId: newUser.tenantId
        },
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newUser,
        tenantName: newUser.tenant?.name || 'No Tenant',
        tenantSlug: newUser.tenant?.slug || null
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
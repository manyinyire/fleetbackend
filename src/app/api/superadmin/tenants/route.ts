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
    const status = searchParams.get('status') || '';
    const plan = searchParams.get('plan') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (plan) {
      where.plan = plan;
    }

    // Get tenants with pagination
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              users: true,
              vehicles: true,
              drivers: true
            }
          }
        }
      }),
      prisma.tenant.count({ where })
    ]);

    // Calculate additional metrics for each tenant
    const tenantsWithMetrics = await Promise.all(
      tenants.map(async (tenant) => {
        // Calculate MRR based on plan
        const mrr = tenant.plan === 'PREMIUM' ? 60 : tenant.plan === 'BASIC' ? 15 : 0;
        
        // Get last login (from user sessions - simplified)
        const lastLogin = await prisma.session.findFirst({
          where: {
            user: {
              tenantId: tenant.id
            }
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });

        return {
          ...tenant,
          mrr,
          lastLogin: lastLogin?.createdAt || null,
          userCount: tenant._count.users,
          vehicleCount: tenant._count.vehicles,
          driverCount: tenant._count.drivers
        };
      })
    );

    // Get summary statistics
    const stats = await prisma.tenant.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const planStats = await prisma.tenant.groupBy({
      by: ['plan'],
      _count: { plan: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        tenants: tenantsWithMetrics,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total: total,
          active: stats.find(s => s.status === 'ACTIVE')?._count.status || 0,
          suspended: stats.find(s => s.status === 'SUSPENDED')?._count.status || 0,
          cancelled: stats.find(s => s.status === 'CANCELED')?._count.status || 0,
          free: planStats.find(p => p.plan === 'FREE')?._count.plan || 0,
          basic: planStats.find(p => p.plan === 'BASIC')?._count.plan || 0,
          premium: planStats.find(p => p.plan === 'PREMIUM')?._count.plan || 0
        }
      }
    });

  } catch (error) {
    console.error('Tenants fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
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
    const { name, email, phone, plan = 'FREE', status = 'ACTIVE' } = data;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'A tenant with this name already exists' },
        { status: 400 }
      );
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        email,
        phone,
        slug,
        plan,
        status
      },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            drivers: true
          }
        }
      }
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TENANT_CREATED',
        entityType: 'Tenant',
        entityId: tenant.id,
        newValues: {
          name: tenant.name,
          email: tenant.email,
          plan: tenant.plan,
          status: tenant.status
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        mrr: plan === 'PREMIUM' ? 60 : plan === 'BASIC' ? 15 : 0,
        userCount: 0,
        vehicleCount: 0,
        driverCount: 0
      }
    });

  } catch (error) {
    console.error('Tenant creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
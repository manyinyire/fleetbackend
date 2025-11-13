import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { withErrorHandler, parsePaginationParams, calculateSkip, buildOrderBy } from '@/lib/api';
import logger from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  email: z.string().email(),
  phone: z.string().optional(),
  plan: z.enum(['FREE', 'BASIC', 'PREMIUM']).default('FREE'),
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
  const status = searchParams.get('status') || '';
  const plan = searchParams.get('plan') || '';

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

  // Execute single query with all includes - NO N+1!
  const [tenants, total] = await prisma.$transaction([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy(sortBy, sortOrder),
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            sessions: {
              select: {
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            }
          }
        },
        _count: {
          select: {
            users: true,
            vehicles: true,
            drivers: true,
            invoices: true,
          }
        }
      }
    }),
    prisma.tenant.count({ where })
  ]);

  // Transform tenants with calculated metrics - NO ADDITIONAL QUERIES!
  const tenantsWithMetrics = tenants.map(tenant => {
    // Calculate MRR based on plan
    const mrr = tenant.plan === 'PREMIUM' ? 60 : tenant.plan === 'BASIC' ? 15 : 0;

    // Get last login from users' sessions (already loaded)
    const lastLogin = tenant.users.reduce((latest: Date | null, user) => {
      const userLastLogin = user.sessions[0]?.createdAt;
      if (!userLastLogin) return latest;
      if (!latest) return userLastLogin;
      return userLastLogin > latest ? userLastLogin : latest;
    }, null);

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone,
      status: tenant.status,
      plan: tenant.plan,
      monthlyRevenue: tenant.monthlyRevenue,
      subscriptionStartDate: tenant.subscriptionStartDate,
      subscriptionEndDate: tenant.subscriptionEndDate,
      autoRenew: tenant.autoRenew,
      suspendedAt: tenant.suspendedAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      mrr,
      lastLogin,
      userCount: tenant._count.users,
      vehicleCount: tenant._count.vehicles,
      driverCount: tenant._count.drivers,
      invoiceCount: tenant._count.invoices,
      users: tenant.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
    };
  });

  // Get summary statistics in parallel
  const [statusStats, planStats, totalRevenue] = await Promise.all([
    prisma.tenant.groupBy({
      by: ['status'],
      _count: { status: true },
      where: where.OR ? undefined : where,
    }),
    prisma.tenant.groupBy({
      by: ['plan'],
      _count: { plan: true },
      where: where.OR ? undefined : where,
    }),
    prisma.tenant.aggregate({
      _sum: { monthlyRevenue: true },
      where: where.OR ? undefined : where,
    })
  ]);

  logger.info({
    page,
    limit,
    total,
    filters: { search, status, plan }
  }, 'Fetched tenants list');

  // Calculate stats for frontend compatibility
  const stats = {
    total,
    active: statusStats.find(s => s.status === 'ACTIVE')?._count.status || 0,
    trial: tenants.filter(t => t.isInTrial).length,
    suspended: statusStats.find(s => s.status === 'SUSPENDED')?._count.status || 0,
    cancelled: statusStats.find(s => s.status === 'CANCELED')?._count.status || 0,
    free: planStats.find(p => p.plan === 'FREE')?._count.plan || 0,
    basic: planStats.find(p => p.plan === 'BASIC')?._count.plan || 0,
    premium: planStats.find(p => p.plan === 'PREMIUM')?._count.plan || 0,
  };

  return NextResponse.json({
    success: true,
    data: {
      tenants: tenantsWithMetrics,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
      summary: {
        total,
        byStatus: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count.status
        })),
        byPlan: planStats.map(stat => ({
          plan: stat.plan,
          count: stat._count.plan
        })),
        totalRevenue: Number(totalRevenue._sum.monthlyRevenue || 0),
      }
    }
  });
}, 'superadmin-tenants:GET');

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Require super admin role
  await requireRole('SUPER_ADMIN');

  const body = await request.json();
  const validatedData = createTenantSchema.parse(body);

  // Check if slug is unique
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: validatedData.slug }
  });

  if (existingTenant) {
    return NextResponse.json(
      { error: 'A tenant with this slug already exists' },
      { status: 409 }
    );
  }

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: validatedData.name,
      slug: validatedData.slug,
      email: validatedData.email,
      phone: validatedData.phone,
      status: 'ACTIVE',
      plan: validatedData.plan,
      monthlyRevenue: 0,
      autoRenew: true,
    },
  });

  logger.info({ tenantId: tenant.id, slug: tenant.slug }, 'Tenant created by super admin');

  return NextResponse.json(tenant, { status: 201 });
}, 'superadmin-tenants:POST');

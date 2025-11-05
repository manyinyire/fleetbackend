import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  withSuperAdmin,
  buildPaginationResponse,
  parsePaginationParams,
  parseSortParams
} from '@/lib/admin-middleware';
import {
  createTenantSchema,
  tenantFilterSchema,
  validateSchema
} from '@/lib/admin-validators';

// GET /api/admin/tenants - Get all tenants with filtering and pagination
export const GET = withSuperAdmin(async (request: NextRequest, session: any) => {
  const { searchParams } = new URL(request.url);

  // Parse and validate pagination parameters
  const { page, limit, skip } = parsePaginationParams(searchParams);

  // Parse sort parameters
  const { orderBy } = parseSortParams(searchParams);

  // Parse and validate filter parameters
  const filters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    plan: searchParams.get('plan') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  };

  const validation = validateSchema(tenantFilterSchema, filters);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid filter parameters', details: validation.errors },
      { status: 400 }
    );
  }

  // Build where clause
  const where: any = {};

  if (validation.data!.search) {
    where.OR = [
      { name: { contains: validation.data!.search, mode: 'insensitive' } },
      { email: { contains: validation.data!.search, mode: 'insensitive' } },
      { phone: { contains: validation.data!.search, mode: 'insensitive' } }
    ];
  }

  if (validation.data!.status) {
    where.status = validation.data!.status;
  }

  if (validation.data!.plan) {
    where.plan = validation.data!.plan;
  }

  // Get tenants with pagination
  const [tenants, totalCount] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true }
        },
        _count: {
          select: {
            users: true,
            vehicles: true,
            drivers: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.tenant.count({ where })
  ]);

  return NextResponse.json(
    buildPaginationResponse(tenants, page, limit, totalCount)
  );
});

// POST /api/admin/tenants - Create new tenant
export const POST = withSuperAdmin(async (request: NextRequest, session: any) => {
  const body = await request.json();

  // Validate request body
  const validation = validateSchema(createTenantSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 }
    );
  }

  const { name, email, phone, plan } = validation.data!;

  // Check if tenant with email already exists
  const existingTenant = await prisma.tenant.findFirst({
    where: { email }
  });

  if (existingTenant) {
    return NextResponse.json(
      { error: 'Tenant with this email already exists' },
      { status: 400 }
    );
  }

  // Generate unique slug
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let slug = baseSlug;
  let counter = 1;

  // Ensure slug is unique
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name,
      email,
      phone,
      slug,
      plan,
      status: 'ACTIVE',
      monthlyRevenue: plan === 'FREE' ? 0 : plan === 'BASIC' ? 15 : 45
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

  return NextResponse.json(tenant, { status: 201 });
});

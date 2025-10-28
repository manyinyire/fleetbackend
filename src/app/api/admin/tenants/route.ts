import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET /api/admin/tenants - Get all tenants with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
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
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (plan) {
      where.plan = plan;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tenants - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, plan = 'FREE' } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if tenant with email already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { email }
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant with this email already exists' },
        { status: 400 }
      );
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        email,
        phone,
        plan: plan as 'FREE' | 'BASIC' | 'PREMIUM',
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

  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
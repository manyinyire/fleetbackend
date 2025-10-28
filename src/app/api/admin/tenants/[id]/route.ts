import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// PATCH /api/admin/tenants/[id] - Update tenant information
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, email, phone } = body;

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        name,
        email,
        ...(phone && { phone })
      }
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// GET /api/admin/tenants/[id] - Get tenant details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            lastLoginAt: true
          }
        },
        vehicles: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
            status: true
          }
        },
        drivers: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            status: true
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
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

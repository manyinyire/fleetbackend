import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/lib/admin-middleware';
import { updateTenantSchema, validateSchema } from '@/lib/admin-validators';

// GET /api/admin/tenants/[id] - Get tenant details
export const GET = withSuperAdmin(
  async (request: NextRequest, session: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

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
  }
);

// PATCH /api/admin/tenants/[id] - Update tenant information
export const PATCH = withSuperAdmin(
  async (request: NextRequest, session: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = validateSchema(updateTenantSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { name, email, phone } = validation.data!;

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // If email is being changed, check if new email is already in use
    if (email && email !== existingTenant.email) {
      const emailInUse = await prisma.tenant.findFirst({
        where: { email, NOT: { id } }
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email already in use by another tenant' },
          { status: 400 }
        );
      }
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone })
      }
    });

    return NextResponse.json(updatedTenant);
  }
);

// DELETE /api/admin/tenants/[id] - Delete tenant
export const DELETE = withSuperAdmin(
  async (request: NextRequest, session: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id },
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

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Safety check: Prevent deletion of tenants with active data
    if (tenant._count.users > 0 || tenant._count.vehicles > 0 || tenant._count.drivers > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete tenant with existing users, vehicles, or drivers',
          details: {
            users: tenant._count.users,
            vehicles: tenant._count.vehicles,
            drivers: tenant._count.drivers
          }
        },
        { status: 400 }
      );
    }

    // Delete tenant
    await prisma.tenant.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
  }
);

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    const tenantId = id;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        },
        vehicles: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
            year: true,
            type: true,
            status: true,
            createdAt: true
          }
        },
        drivers: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        },
        settings: true,
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
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Calculate MRR
    const mrr = tenant.plan === 'PREMIUM' ? 60 : tenant.plan === 'BASIC' ? 15 : 0;

    // Get recent activity for this tenant
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        tenantId: tenantId
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        mrr,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Tenant details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant details' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Require super admin role
    const user = await requireRole('SUPER_ADMIN');

    const tenantId = id;
    const data = await request.json();

    // Get current tenant data for audit log
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!currentTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        plan: data.plan
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

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TENANT_UPDATED',
        entityType: 'Tenant',
        entityId: tenantId,
        oldValues: {
          name: currentTenant.name,
          email: currentTenant.email,
          status: currentTenant.status,
          plan: currentTenant.plan
        },
        newValues: {
          name: updatedTenant.name,
          email: updatedTenant.email,
          status: updatedTenant.status,
          plan: updatedTenant.plan
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedTenant,
        mrr: updatedTenant.plan === 'PREMIUM' ? 60 : updatedTenant.plan === 'BASIC' ? 15 : 0
      }
    });

  } catch (error) {
    console.error('Tenant update error:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Require super admin role
    const user = await requireRole('SUPER_ADMIN');

    const tenantId = id;

    // Get tenant data for audit log
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Delete tenant (cascade will handle related records)
    await prisma.tenant.delete({
      where: { id: tenantId }
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TENANT_DELETED',
        entityType: 'Tenant',
        entityId: tenantId,
        oldValues: {
          name: tenant.name,
          email: tenant.email,
          status: tenant.status,
          plan: tenant.plan
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully'
    });

  } catch (error) {
    console.error('Tenant deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
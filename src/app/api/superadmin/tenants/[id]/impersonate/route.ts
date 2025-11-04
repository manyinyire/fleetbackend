import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const adminUser = await requireRole('SUPER_ADMIN');
    const tenantId = id;
    const { reason, userId } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason for impersonation is required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get user to impersonate (either provided userId or first tenant admin)
    let targetUser;
    if (userId) {
      targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!targetUser || targetUser.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'User not found or does not belong to this tenant' },
          { status: 404 }
        );
      }
    } else {
      // Get first admin user for this tenant to impersonate
      targetUser = await prisma.user.findFirst({
        where: {
          tenantId: tenantId,
          role: 'TENANT_ADMIN'
        }
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: 'No admin user found for this tenant' },
          { status: 404 }
        );
      }
    }

    // Use BetterAuth admin plugin to impersonate user
    const headersList = await headers();
    const impersonationResult = await auth.api.impersonateUser({
      body: {
        userId: targetUser.id,
      },
      headers: headersList,
    });

    // Log the impersonation
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'IMPERSONATION_STARTED',
        entityType: 'Tenant',
        entityId: tenantId,
        newValues: {
          tenantName: tenant.name,
          tenantAdminEmail: targetUser.email,
          impersonatedUserId: targetUser.id,
          reason: reason,
          startedAt: new Date().toISOString()
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        tenantId: tenant.id,
        tenantName: tenant.name,
        impersonatedUserId: targetUser.id,
        redirectUrl: `/dashboard` // Redirect to tenant dashboard
      }
    });
  } catch (error: any) {
    console.error('Impersonation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start impersonation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


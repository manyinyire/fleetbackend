import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

// Track active impersonation sessions per admin (adminId -> Set of tenantIds)
const activeImpersonations = new Map<string, Set<string>>();

// Maximum concurrent impersonations per admin
const MAX_CONCURRENT_IMPERSONATIONS = 3;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Apply strict rate limiting (5 impersonations per 15 minutes)
    const rateLimitResult = await rateLimit(request, {
      interval: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    });

    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    const adminUser = await requireRole('SUPER_ADMIN');
    const tenantId = id;
    const { reason, userId } = await request.json();

    // Validate reason is substantial (minimum 10 characters)
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Detailed reason for impersonation is required (minimum 10 characters)' },
        { status: 400 }
      );
    }

    // Check concurrent impersonation limit
    const adminImpersonations = activeImpersonations.get(adminUser.id) || new Set();
    if (adminImpersonations.size >= MAX_CONCURRENT_IMPERSONATIONS) {
      return NextResponse.json(
        { error: `Maximum concurrent impersonations (${MAX_CONCURRENT_IMPERSONATIONS}) reached. Stop existing impersonation sessions first.` },
        { status: 429 }
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

    // Track active impersonation
    if (!activeImpersonations.has(adminUser.id)) {
      activeImpersonations.set(adminUser.id, new Set());
    }
    activeImpersonations.get(adminUser.id)!.add(tenantId);

    // Set auto-timeout for impersonation (1 hour)
    setTimeout(() => {
      const sessions = activeImpersonations.get(adminUser.id);
      if (sessions) {
        sessions.delete(tenantId);
        if (sessions.size === 0) {
          activeImpersonations.delete(adminUser.id);
        }
      }
    }, 60 * 60 * 1000); // 1 hour

    // Log the impersonation with enhanced details
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
          startedAt: new Date().toISOString(),
          expectedDuration: '1 hour',
          adminName: (adminUser as any).name,
          adminEmail: (adminUser as any).email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Create alert for security monitoring
    await prisma.systemAlert.create({
      data: {
        type: 'SECURITY',
        severity: 'INFO',
        title: 'Admin Impersonation Started',
        message: `${(adminUser as any).email} is impersonating ${targetUser.email} (Tenant: ${tenant.name})`,
        data: {
          adminId: adminUser.id,
          targetUserId: targetUser.id,
          tenantId,
          reason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tenantId: tenant.id,
        tenantName: tenant.name,
        impersonatedUserId: targetUser.id,
        redirectUrl: `/dashboard`,
        expiresIn: '1 hour',
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


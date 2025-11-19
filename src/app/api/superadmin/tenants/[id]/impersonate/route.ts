import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';


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

    // TODO: Implement impersonation when BetterAuth supports it
    return NextResponse.json({
      success: false,
      error: 'Impersonation feature not yet implemented'
    }, { status: 501 });
  } catch (error: any) {
    console.error('Impersonation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start impersonation' },
      { status: 500 }
    );
  } finally {
  }
}


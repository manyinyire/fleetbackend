import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AuditLogger } from '@/lib/audit-logger';

// PATCH /api/admin/tenants/[id]/plan - Change tenant plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!['FREE', 'BASIC', 'PREMIUM'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get current tenant to log the change
    const currentTenant = await prisma.tenant.findUnique({
      where: { id },
      select: { plan: true, name: true }
    });

    if (!currentTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Update plan
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        plan: plan as 'FREE' | 'BASIC' | 'PREMIUM',
        // Update monthly revenue based on plan
        monthlyRevenue: plan === 'FREE' ? 0 : plan === 'BASIC' ? 15 : 45
      }
    });

    // Log the change
    await AuditLogger.log({
      action: 'UPDATE_PLAN',
      entityType: 'TENANT',
      entityId: id,
      oldValues: { plan: currentTenant.plan },
      newValues: { plan },
      metadata: { tenantName: currentTenant.name }
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

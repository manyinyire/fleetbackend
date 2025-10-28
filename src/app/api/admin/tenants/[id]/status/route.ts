import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AuditLogger } from '@/lib/audit-logger';

// PATCH /api/admin/tenants/[id]/status - Change tenant status (suspend/activate)
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
    const { status } = body;

    // Validate status
    if (!['ACTIVE', 'SUSPENDED', 'CANCELED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get current tenant to log the change
    const currentTenant = await prisma.tenant.findUnique({
      where: { id },
      select: { status: true, name: true }
    });

    if (!currentTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Update status
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        status: status as 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
        suspendedAt: status === 'SUSPENDED' ? new Date() : null
      }
    });

    // Log the change
    await AuditLogger.log({
      action: status === 'SUSPENDED' ? 'SUSPEND_TENANT' : 'ACTIVATE_TENANT',
      entityType: 'TENANT',
      entityId: id,
      oldValues: { status: currentTenant.status },
      newValues: { status },
      metadata: {
        tenantName: currentTenant.name,
        reason: status === 'SUSPENDED' ? 'Admin action' : 'Reactivated by admin'
      }
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

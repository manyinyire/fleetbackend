import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSuperAdmin } from '@/lib/admin-middleware';
import { changeTenantStatusSchema, validateSchema } from '@/lib/admin-validators';
import { AuditLogger } from '@/lib/audit-logger';

// PATCH /api/admin/tenants/[id]/status - Change tenant status (suspend/activate)
export const PATCH = withSuperAdmin(
  async (request: NextRequest, session: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json();

    // Validate status
    const validation = validateSchema(changeTenantStatusSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { status, reason } = validation.data!;

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
        status,
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
        reason: reason || (status === 'SUSPENDED' ? 'Admin action' : 'Reactivated by admin')
      }
    });

    return NextResponse.json(updatedTenant);
  }
);

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    const remittance = await prisma.remittance.findUnique({
      where: { id },
      include: {
        driver: true,
        vehicle: true,
      },
    });

    if (!remittance) {
      return NextResponse.json(
        { error: 'Remittance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(remittance);
  } catch (error) {
    console.error('Remittance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch remittance' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { user, tenantId } = await requireTenant();
    const data = await request.json();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    // Get existing remittance
    const existingRemittance = await prisma.remittance.findUnique({
      where: { id },
    });

    if (!existingRemittance) {
      return NextResponse.json(
        { error: 'Remittance not found' },
        { status: 404 }
      );
    }

    // Calculate debt balance change if status is changing
    let debtBalanceChange = 0;
    if (data.status && data.status !== existingRemittance.status) {
      if (existingRemittance.status === 'APPROVED' && data.status !== 'APPROVED') {
        // Previously approved, now not approved - add back to debt
        debtBalanceChange = Number(existingRemittance.amount);
      } else if (existingRemittance.status !== 'APPROVED' && data.status === 'APPROVED') {
        // Previously not approved, now approved - reduce debt
        debtBalanceChange = -Number(data.amount || existingRemittance.amount);
      }
    }

    // Update remittance
    const updatedRemittance = await prisma.remittance.update({
      where: { id },
      data: {
        ...(data.driverId && { driverId: data.driverId }),
        ...(data.vehicleId && { vehicleId: data.vehicleId }),
        ...(data.amount && { amount: data.amount }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.status && { 
          status: data.status,
          approvedBy: data.status === 'APPROVED' ? user.id : null,
          approvedAt: data.status === 'APPROVED' ? new Date() : null,
        }),
        ...(data.proofOfPayment !== undefined && { proofOfPayment: data.proofOfPayment }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        driver: true,
        vehicle: true,
      },
    });

    // Update driver's debt balance if needed
    if (debtBalanceChange !== 0) {
      await prisma.driver.update({
        where: { id: existingRemittance.driverId },
        data: {
          debtBalance: {
            increment: debtBalanceChange,
          },
        },
      });
    }

    return NextResponse.json(updatedRemittance);
  } catch (error) {
    console.error('Remittance update error:', error);
    return NextResponse.json(
      { error: 'Failed to update remittance' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    // Get existing remittance
    const existingRemittance = await prisma.remittance.findUnique({
      where: { id },
    });

    if (!existingRemittance) {
      return NextResponse.json(
        { error: 'Remittance not found' },
        { status: 404 }
      );
    }

    // Update driver's debt balance if remittance was approved
    if (existingRemittance.status === 'APPROVED') {
      await prisma.driver.update({
        where: { id: existingRemittance.driverId },
        data: {
          debtBalance: {
            increment: Number(existingRemittance.amount),
          },
        },
      });
    }

    // Delete remittance
    await prisma.remittance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remittance deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete remittance' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaResults } from '@/lib/serialize-prisma';

export async function GET(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const vehicleId = searchParams.get('vehicleId');
    const status = searchParams.get('status');

    const where: any = {
      tenantId: tenantId
    };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;

    const remittances = await prisma.remittance.findMany({
      where,
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { date: 'desc' },
      take: 1000, // Remove any default limit
    });

    // Convert Decimal objects to numbers
    const serializedRemittances = serializePrismaResults(remittances);
    
    return NextResponse.json(serializedRemittances);
  } catch (error) {
    console.error('Remittances fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch remittances' },
      { status: 500 }
    );
  }
}
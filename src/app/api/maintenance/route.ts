import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    await setTenantContext(tenantId);
    
    // Get scoped Prisma client
    const prisma = getTenantPrisma(tenantId);

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const [maintenanceRecords, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          vehicle: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      maintenanceRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Maintenance records fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    await setTenantContext(tenantId);
    
    // Get scoped Prisma client
    const prisma = getTenantPrisma(tenantId);

    const body = await request.json();
    const { vehicleId, date, mileage, type, description, cost, provider, invoice } = body;

    // Validate required fields
    if (!vehicleId || !date || !mileage || !type || !description || !cost || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create maintenance record
    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: {
        tenantId,
        vehicleId,
        date: new Date(date),
        mileage: parseInt(mileage),
        type,
        description,
        cost: parseFloat(cost),
        provider,
        invoice: invoice || null,
      },
      include: {
        vehicle: true,
      },
    });

    return NextResponse.json(maintenanceRecord, { status: 201 });
  } catch (error) {
    console.error('Maintenance record creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    );
  }
}

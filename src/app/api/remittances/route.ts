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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const vehicleId = searchParams.get('vehicleId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (driverId) where.driverId = driverId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;

    const [remittances, total] = await Promise.all([
      prisma.remittance.findMany({
        where,
        include: {
          driver: true,
          vehicle: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.remittance.count({ where }),
    ]);

    return NextResponse.json({
      remittances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Remittances fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch remittances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    const data = await request.json();
    
    // Set RLS context
    await setTenantContext(tenantId);
    
    // Get scoped Prisma client
    const prisma = getTenantPrisma(tenantId);

    // Check if driver and vehicle exist and belong to tenant
    const [driver, vehicle] = await Promise.all([
      prisma.driver.findUnique({ where: { id: data.driverId } }),
      prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
    ]);

    if (!driver || !vehicle) {
      return NextResponse.json(
        { error: 'Driver or vehicle not found' },
        { status: 404 }
      );
    }

    // Check if driver is assigned to the vehicle
    const assignment = await prisma.driverVehicleAssignment.findFirst({
      where: {
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        endDate: null, // Active assignment
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Driver is not assigned to this vehicle' },
        { status: 400 }
      );
    }

    const remittance = await prisma.remittance.create({
      data: {
        tenantId,
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        amount: data.amount,
        date: new Date(data.date),
        status: data.status || 'PENDING',
        proofOfPayment: data.proofOfPayment || null,
        notes: data.notes || null,
      },
      include: {
        driver: true,
        vehicle: true,
      },
    });

    return NextResponse.json(remittance);
  } catch (error) {
    console.error('Remittance creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create remittance' },
      { status: 500 }
    );
  }
}

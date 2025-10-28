import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    const assignments = await prisma.driverVehicleAssignment.findMany({
      include: {
        driver: true,
        vehicle: true
      },
      orderBy: { createdAt: 'desc' },
      where: {
        tenantId: tenantId
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Assignments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    const data = await request.json();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

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

    // Check if there's already an active assignment for this driver to this vehicle
    const existingAssignment = await prisma.driverVehicleAssignment.findFirst({
      where: {
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        endDate: null,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Driver is already assigned to this vehicle' },
        { status: 400 }
      );
    }

    // Check if the vehicle is already assigned to ANY driver
    const vehicleAssignment = await prisma.driverVehicleAssignment.findFirst({
      where: {
        vehicleId: data.vehicleId,
        endDate: null,
      },
      include: {
        driver: true,
      },
    });

    if (vehicleAssignment) {
      return NextResponse.json(
        { 
          error: `This vehicle is already assigned to ${vehicleAssignment.driver.fullName}` 
        },
        { status: 400 }
      );
    }

    // If isPrimary, end all other primary assignments for this driver
    if (data.isPrimary !== false) {
      await prisma.driverVehicleAssignment.updateMany({
        where: {
          driverId: data.driverId,
          isPrimary: true,
          endDate: null,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const assignment = await prisma.driverVehicleAssignment.create({
      data: {
        tenantId,
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        isPrimary: data.isPrimary || true,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        driver: true,
        vehicle: true
      }
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Assignment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
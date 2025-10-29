'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

export async function assignVehicleToDriver(
  driverId: string,
  vehicleId: string,
  isPrimary: boolean = true
) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Check if driver and vehicle exist and belong to tenant
  const [driver, vehicle] = await Promise.all([
    prisma.driver.findUnique({ where: { id: driverId } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);

  if (!driver || !vehicle) {
    throw new Error('Driver or vehicle not found');
  }

  // Check if there's already an active assignment for this driver to this vehicle
  const existingAssignment = await prisma.driverVehicleAssignment.findFirst({
    where: {
      driverId,
      vehicleId,
      endDate: null,
    },
  });

  if (existingAssignment) {
    throw new Error('Driver is already assigned to this vehicle');
  }

  // Check if the vehicle is already assigned to ANY driver
  const vehicleAssignment = await prisma.driverVehicleAssignment.findFirst({
    where: {
      vehicleId,
      endDate: null,
    },
    include: {
      driver: true,
    },
  });

  if (vehicleAssignment) {
    throw new Error(
      `This vehicle is already assigned to ${vehicleAssignment.driver.fullName}`
    );
  }

  // If isPrimary, end all other primary assignments for this driver
  if (isPrimary) {
    await prisma.driverVehicleAssignment.updateMany({
      where: {
        driverId,
        isPrimary: true,
        endDate: null,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  // Create new assignment
  const assignment = await prisma.driverVehicleAssignment.create({
    data: {
      tenantId,
      driverId,
      vehicleId,
      isPrimary,
      startDate: new Date(),
    },
  });

  // Revalidate pages
  revalidatePath('/drivers');
  revalidatePath(`/drivers/${driverId}`);
  revalidatePath('/vehicles');
  revalidatePath(`/vehicles/${vehicleId}`);

  return assignment;
}

export async function unassignVehicleFromDriver(assignmentId: string) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // End the assignment
  const assignment = await prisma.driverVehicleAssignment.update({
    where: { id: assignmentId },
    data: {
      endDate: new Date(),
    },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  // Revalidate pages
  revalidatePath('/drivers');
  revalidatePath(`/drivers/${assignment.driverId}`);
  revalidatePath('/vehicles');
  revalidatePath(`/vehicles/${assignment.vehicleId}`);

  return assignment;
}

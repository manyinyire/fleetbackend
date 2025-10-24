'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createRemittanceSchema = z.object({
  driverId: z.string().min(1, 'Driver is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.coerce.date(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  proofOfPayment: z.string().optional(),
  notes: z.string().optional(),
});

const updateRemittanceSchema = createRemittanceSchema.partial().extend({
  id: z.string().min(1, 'Remittance ID is required'),
});

export type CreateRemittanceInput = z.infer<typeof createRemittanceSchema>;
export type UpdateRemittanceInput = z.infer<typeof updateRemittanceSchema>;

export async function createRemittance(data: CreateRemittanceInput) {
  const { user, tenantId } = await requireTenant();

  // Validate input
  const validated = createRemittanceSchema.parse(data);

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Check if driver and vehicle exist and belong to tenant
  const [driver, vehicle] = await Promise.all([
    prisma.driver.findUnique({ where: { id: validated.driverId } }),
    prisma.vehicle.findUnique({ where: { id: validated.vehicleId } }),
  ]);

  if (!driver || !vehicle) {
    throw new Error('Driver or vehicle not found');
  }

  // Check if driver is assigned to the vehicle
  const assignment = await prisma.driverVehicleAssignment.findFirst({
    where: {
      driverId: validated.driverId,
      vehicleId: validated.vehicleId,
      endDate: null, // Active assignment
    },
  });

  if (!assignment) {
    throw new Error('Driver is not assigned to this vehicle');
  }

  // Create remittance
  const remittance = await prisma.remittance.create({
    data: {
      tenantId,
      driverId: validated.driverId,
      vehicleId: validated.vehicleId,
      amount: validated.amount,
      date: validated.date,
      status: validated.status,
      proofOfPayment: validated.proofOfPayment || null,
      notes: validated.notes || null,
    },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  // Update driver's debt balance if status is APPROVED
  if (validated.status === 'APPROVED') {
    await prisma.driver.update({
      where: { id: validated.driverId },
      data: {
        debtBalance: {
          decrement: validated.amount,
        },
      },
    });
  }

  // Revalidate pages
  revalidatePath('/remittances');
  revalidatePath(`/drivers/${validated.driverId}`);
  revalidatePath(`/vehicles/${validated.vehicleId}`);

  return remittance;
}

export async function updateRemittance(data: UpdateRemittanceInput) {
  const { user, tenantId } = await requireTenant();

  // Validate input
  const validated = updateRemittanceSchema.parse(data);

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Get existing remittance
  const existingRemittance = await prisma.remittance.findUnique({
    where: { id: validated.id },
    include: { driver: true, vehicle: true },
  });

  if (!existingRemittance) {
    throw new Error('Remittance not found');
  }

  // Calculate debt balance change if status is changing
  let debtBalanceChange = 0;
  if (validated.status && validated.status !== existingRemittance.status) {
    if (existingRemittance.status === 'APPROVED' && validated.status !== 'APPROVED') {
      // Previously approved, now not approved - add back to debt
      debtBalanceChange = Number(existingRemittance.amount);
    } else if (existingRemittance.status !== 'APPROVED' && validated.status === 'APPROVED') {
      // Previously not approved, now approved - reduce debt
      debtBalanceChange = -Number(validated.amount || existingRemittance.amount);
    }
  }

  // Update remittance
  const updatedRemittance = await prisma.remittance.update({
    where: { id: validated.id },
    data: {
      ...(validated.driverId && { driverId: validated.driverId }),
      ...(validated.vehicleId && { vehicleId: validated.vehicleId }),
      ...(validated.amount && { amount: validated.amount }),
      ...(validated.date && { date: validated.date }),
      ...(validated.status && { 
        status: validated.status,
        approvedBy: validated.status === 'APPROVED' ? user.id : null,
        approvedAt: validated.status === 'APPROVED' ? new Date() : null,
      }),
      ...(validated.proofOfPayment !== undefined && { proofOfPayment: validated.proofOfPayment }),
      ...(validated.notes !== undefined && { notes: validated.notes }),
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

  // Revalidate pages
  revalidatePath('/remittances');
  revalidatePath(`/drivers/${existingRemittance.driverId}`);
  revalidatePath(`/vehicles/${existingRemittance.vehicleId}`);

  return updatedRemittance;
}

export async function deleteRemittance(id: string) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Get existing remittance
  const existingRemittance = await prisma.remittance.findUnique({
    where: { id },
  });

  if (!existingRemittance) {
    throw new Error('Remittance not found');
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

  // Revalidate pages
  revalidatePath('/remittances');
  revalidatePath(`/drivers/${existingRemittance.driverId}`);
  revalidatePath(`/vehicles/${existingRemittance.vehicleId}`);

  return { success: true };
}

export async function approveRemittance(id: string) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Get existing remittance
  const existingRemittance = await prisma.remittance.findUnique({
    where: { id },
  });

  if (!existingRemittance) {
    throw new Error('Remittance not found');
  }

  // Update remittance status
  const updatedRemittance = await prisma.remittance.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: user.id,
      approvedAt: new Date(),
    },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  // Update driver's debt balance if not already approved
  if (existingRemittance.status !== 'APPROVED') {
    await prisma.driver.update({
      where: { id: existingRemittance.driverId },
      data: {
        debtBalance: {
          decrement: Number(existingRemittance.amount),
        },
      },
    });
  }

  // Revalidate pages
  revalidatePath('/remittances');
  revalidatePath(`/drivers/${existingRemittance.driverId}`);
  revalidatePath(`/vehicles/${existingRemittance.vehicleId}`);

  return updatedRemittance;
}

export async function rejectRemittance(id: string, reason?: string) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  await setTenantContext(tenantId);

  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Get existing remittance
  const existingRemittance = await prisma.remittance.findUnique({
    where: { id },
  });

  if (!existingRemittance) {
    throw new Error('Remittance not found');
  }

  // Update remittance status
  const updatedRemittance = await prisma.remittance.update({
    where: { id },
    data: {
      status: 'REJECTED',
      notes: reason ? `${existingRemittance.notes || ''}\nRejection reason: ${reason}`.trim() : existingRemittance.notes,
    },
    include: {
      driver: true,
      vehicle: true,
    },
  });

  // Update driver's debt balance if was previously approved
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

  // Revalidate pages
  revalidatePath('/remittances');
  revalidatePath(`/drivers/${existingRemittance.driverId}`);
  revalidatePath(`/vehicles/${existingRemittance.vehicleId}`);

  return updatedRemittance;
}

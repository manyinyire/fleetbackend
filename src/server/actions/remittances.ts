'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { 
  calculateRemittanceTarget, 
  isTargetReached,
  getPeriodBoundaries,
  calculateRemainingBalance
} from '@/lib/remittance-target';

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
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

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

  // Calculate full target amount from vehicle's payment configuration
  const fullTarget = calculateRemittanceTarget(
    vehicle.paymentModel,
    vehicle.paymentConfig as any
  );

  // For period-based targets (DAILY, WEEKLY), calculate remaining balance
  let targetAmount: number | null = fullTarget;
  let remainingBalance: number | null = null;

  if (fullTarget !== null && vehicle.paymentModel === 'DRIVER_REMITS') {
    const paymentConfig = vehicle.paymentConfig as any;
    const frequency = paymentConfig?.frequency || 'DAILY';

    if (frequency === 'DAILY' || frequency === 'WEEKLY' || frequency === 'MONTHLY') {
      // Get period boundaries for the remittance date
      const { startDate, endDate } = getPeriodBoundaries(frequency, validated.date);

      // Sum existing approved remittances for this driver/vehicle in the current period
      // Note: For create operations, validated.id won't exist, so this will fetch all approved remittances
      const existingRemittances = await prisma.remittance.findMany({
        where: {
          driverId: validated.driverId,
          vehicleId: validated.vehicleId,
          status: 'APPROVED',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
        },
      });

      const existingSum = existingRemittances.reduce(
        (sum, r) => sum + Number(r.amount),
        0
      );

      // Calculate remaining balance
      remainingBalance = calculateRemainingBalance(fullTarget, existingSum);
      targetAmount = remainingBalance; // Use remaining balance as the target for this remittance
    }
  }
  
  // Check if target is reached (using remaining balance if applicable)
  const targetReached = isTargetReached(validated.amount, targetAmount);

  // Create remittance
  const remittance = await prisma.remittance.create({
    data: {
      tenantId,
      driverId: validated.driverId,
      vehicleId: validated.vehicleId,
      amount: validated.amount,
      targetAmount: targetAmount !== null ? new Prisma.Decimal(targetAmount) : null,
      targetReached: targetReached,
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
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Get existing remittance with vehicle
  const existingRemittance = await prisma.remittance.findUnique({
    where: { id: validated.id },
    include: { driver: true, vehicle: true },
  });

  if (!existingRemittance) {
    throw new Error('Remittance not found');
  }

  // Get vehicle (use existing or fetch new one if vehicleId changed)
  const vehicleId = validated.vehicleId || existingRemittance.vehicleId;
  const vehicle = vehicleId === existingRemittance.vehicleId 
    ? existingRemittance.vehicle 
    : await prisma.vehicle.findUnique({ where: { id: vehicleId } });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Calculate new target amount and target reached status
  const amount = validated.amount !== undefined ? validated.amount : Number(existingRemittance.amount);
  const remittanceDate = validated.date || existingRemittance.date;
  
  // Calculate full target amount from vehicle's payment configuration
  const fullTarget = calculateRemittanceTarget(
    vehicle.paymentModel,
    vehicle.paymentConfig as any
  );

  // For period-based targets (DAILY, WEEKLY), calculate remaining balance
  let targetAmount: number | null = fullTarget;
  let remainingBalance: number | null = null;

  if (fullTarget !== null && vehicle.paymentModel === 'DRIVER_REMITS') {
    const paymentConfig = vehicle.paymentConfig as any;
    const frequency = paymentConfig?.frequency || 'DAILY';

    if (frequency === 'DAILY' || frequency === 'WEEKLY' || frequency === 'MONTHLY') {
      // Get period boundaries for the remittance date
      const { startDate, endDate } = getPeriodBoundaries(frequency, remittanceDate);

      // Sum existing approved remittances for this driver/vehicle in the current period
      // Exclude the current remittance being updated
      const existingRemittances = await prisma.remittance.findMany({
        where: {
          driverId: existingRemittance.driverId,
          vehicleId: existingRemittance.vehicleId,
          status: 'APPROVED',
          date: {
            gte: startDate,
            lte: endDate,
          },
          id: { not: validated.id },
        },
        select: {
          amount: true,
        },
      });

      const existingSum = existingRemittances.reduce(
        (sum, r) => sum + Number(r.amount),
        0
      );

      // Calculate remaining balance
      remainingBalance = calculateRemainingBalance(fullTarget, existingSum);
      targetAmount = remainingBalance; // Use remaining balance as the target for this remittance
    }
  }

  const targetReached = isTargetReached(amount, targetAmount);

  // Convert targetAmount to Prisma Decimal if not null
  const targetAmountDecimal = targetAmount !== null ? new Prisma.Decimal(targetAmount) : null;

  // Calculate debt balance change if status is changing
  let debtBalanceChange = 0;
  if (validated.status && validated.status !== existingRemittance.status) {
    if (existingRemittance.status === 'APPROVED' && validated.status !== 'APPROVED') {
      // Previously approved, now not approved - add back to debt
      debtBalanceChange = Number(existingRemittance.amount);
    } else if (existingRemittance.status !== 'APPROVED' && validated.status === 'APPROVED') {
      // Previously not approved, now approved - reduce debt
      debtBalanceChange = -amount;
    }
  }

  // Update remittance
  const updatedRemittance = await prisma.remittance.update({
    where: { id: validated.id },
    data: {
      ...(validated.driverId && { driverId: validated.driverId }),
      ...(validated.vehicleId && { vehicleId: validated.vehicleId }),
      ...(validated.amount !== undefined && { amount: validated.amount }),
      targetAmount: targetAmountDecimal,
      targetReached: targetReached,
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

/**
 * Calculate the remaining balance for a driver/vehicle for the current period
 * @param driverId The driver ID
 * @param vehicleId The vehicle ID
 * @param date The date to calculate the period for
 * @returns Object with fullTarget, existingSum, and remainingBalance
 */
export async function getRemainingBalance(
  driverId: string,
  vehicleId: string,
  date: Date
) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Fetch vehicle with payment config
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Calculate full target
  const fullTarget = calculateRemittanceTarget(
    vehicle.paymentModel,
    vehicle.paymentConfig as any
  );

  if (fullTarget === null || vehicle.paymentModel !== 'DRIVER_REMITS') {
    return {
      fullTarget: null,
      existingSum: 0,
      remainingBalance: null,
    };
  }

  const paymentConfig = vehicle.paymentConfig as any;
  const frequency = paymentConfig?.frequency || 'DAILY';

  if (frequency !== 'DAILY' && frequency !== 'WEEKLY' && frequency !== 'MONTHLY') {
    return {
      fullTarget,
      existingSum: 0,
      remainingBalance: fullTarget,
    };
  }

  // Get period boundaries
  const { startDate, endDate } = getPeriodBoundaries(frequency, date);

  // Sum existing approved remittances for this driver/vehicle in the current period
  const existingRemittances = await prisma.remittance.findMany({
    where: {
      driverId,
      vehicleId,
      status: 'APPROVED',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
    },
  });

  const existingSum = existingRemittances.reduce(
    (sum, r) => sum + Number(r.amount),
    0
  );

  const remainingBalance = calculateRemainingBalance(fullTarget, existingSum);

  return {
    fullTarget,
    existingSum,
    remainingBalance,
    periodStart: startDate,
    periodEnd: endDate,
    frequency,
  };
}

export async function rejectRemittance(id: string, reason?: string) {
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

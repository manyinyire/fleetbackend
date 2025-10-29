'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: z.enum(['CAR', 'OMNIBUS', 'BIKE']),
  initialCost: z.number().positive('Initial cost must be positive'),
  currentMileage: z.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']).default('ACTIVE'),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export async function createVehicle(data: CreateVehicleInput) {
  const { user, tenantId } = await requireTenant();

  // Validate input
  const validated = createVehicleSchema.parse(data);

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Check if registration number already exists for this tenant
  const existing = await prisma.vehicle.findFirst({
    where: {
      tenantId,
      registrationNumber: validated.registrationNumber,
    },
  });

  if (existing) {
    throw new Error('A vehicle with this registration number already exists');
  }

  // Create vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      tenantId,
      registrationNumber: validated.registrationNumber,
      make: validated.make,
      model: validated.model,
      year: validated.year,
      type: validated.type,
      initialCost: validated.initialCost,
      currentMileage: validated.currentMileage,
      status: validated.status,
    },
  });

  // Revalidate vehicles page
  revalidatePath('/vehicles');

  return vehicle;
}

export async function updateVehicle(id: string, data: Partial<CreateVehicleInput>) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Update vehicle
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...data,
    },
  });

  // Revalidate vehicles page
  revalidatePath('/vehicles');
  revalidatePath(`/vehicles/${id}`);

  return vehicle;
}

export async function deleteVehicle(id: string) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Delete vehicle
  await prisma.vehicle.delete({
    where: { id },
  });

  // Revalidate vehicles page
  revalidatePath('/vehicles');
}

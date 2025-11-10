'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { PremiumFeatureService } from '@/lib/premium-features';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createDriverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nationalId: z.string().min(1, 'National ID is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  homeAddress: z.string().min(1, 'Home address is required'),
  nextOfKin: z.string().min(1, 'Next of kin is required'),
  nextOfKinPhone: z.string().min(1, 'Next of kin phone is required'),
  // Defensive license for commuter omnibus
  hasDefensiveLicense: z.boolean().default(false),
  defensiveLicenseNumber: z.string().optional(),
  defensiveLicenseExpiry: z.date().optional(),
  // Payment configuration is now on Vehicle - drivers inherit it when assigned
  debtBalance: z.number().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).default('ACTIVE'),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export async function createDriver(data: CreateDriverInput) {
  const { user, tenantId } = await requireTenant();

  // Validate input
  const validated = createDriverSchema.parse(data);

  // Check subscription limit
  const featureCheck = await PremiumFeatureService.canAddDriver(tenantId);
  if (!featureCheck.allowed) {
    const error: any = new Error(featureCheck.reason || 'Driver limit reached');
    error.code = 'LIMIT_EXCEEDED';
    error.currentUsage = featureCheck.currentUsage;
    error.limit = featureCheck.limit;
    error.suggestedPlan = featureCheck.suggestedPlan;
    error.upgradeMessage = featureCheck.upgradeMessage;
    throw error;
  }

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Check if national ID already exists for this tenant
  const existing = await prisma.driver.findFirst({
    where: {
      tenantId,
      nationalId: validated.nationalId,
    },
  });

  if (existing) {
    throw new Error('A driver with this national ID already exists');
  }

  // Create driver
  const driver = await prisma.driver.create({
    data: {
      tenantId,
      fullName: validated.fullName,
      nationalId: validated.nationalId,
      licenseNumber: validated.licenseNumber,
      phone: validated.phone,
      email: validated.email || null,
      homeAddress: validated.homeAddress,
      nextOfKin: validated.nextOfKin,
      nextOfKinPhone: validated.nextOfKinPhone,
      hasDefensiveLicense: validated.hasDefensiveLicense,
      defensiveLicenseNumber: validated.defensiveLicenseNumber || null,
      defensiveLicenseExpiry: validated.defensiveLicenseExpiry || null,
      // Payment configuration is now on Vehicle - drivers inherit it when assigned
      debtBalance: validated.debtBalance,
      status: validated.status,
    },
  });

  // Revalidate drivers page
  revalidatePath('/drivers');

  return driver;
}

export async function updateDriver(id: string, data: Partial<CreateDriverInput>) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Update driver
  const driver = await prisma.driver.update({
    where: { id },
    data: {
      ...data,
      email: data.email || null,
    },
  });

  // Revalidate drivers page
  revalidatePath('/drivers');
  revalidatePath(`/drivers/${id}`);

  return driver;
}

export async function deleteDriver(id: string) {
  const { user, tenantId } = await requireTenant();

  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }

  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  // Delete driver
  await prisma.driver.delete({
    where: { id },
  });

  // Revalidate drivers page
  revalidatePath('/drivers');
}

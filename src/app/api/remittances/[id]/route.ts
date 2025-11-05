import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, validateBody } from '@/lib/api-middleware';
import { serializePrismaResults } from '@/lib/serialize-prisma';
import { z } from 'zod';

// Validation schema for updating a remittance
const updateRemittanceSchema = z.object({
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  proofOfPayment: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const GET = withTenantAuth(async ({ prisma, tenantId, request }, { params }) => {
  const { id } = await params;

  const remittance = await prisma.remittance.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          licenseNumber: true,
          debtBalance: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          make: true,
          model: true,
        },
      },
    },
  });

  if (!remittance) {
    return successResponse({ error: 'Remittance not found' }, 404);
  }

  return successResponse(serializePrismaResults(remittance));
});

export const PUT = withTenantAuth(async ({ prisma, tenantId, user, request }, { params }) => {
  const { id } = await params;
  const data = await validateBody(request, updateRemittanceSchema);

  // Get existing remittance
  const existingRemittance = await prisma.remittance.findFirst({
    where: {
      id,
      tenantId,
    },
  });

  if (!existingRemittance) {
    return successResponse({ error: 'Remittance not found' }, 404);
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

  // Build update data
  const updateData: any = {};
  if (data.driverId) updateData.driverId = data.driverId;
  if (data.vehicleId) updateData.vehicleId = data.vehicleId;
  if (data.amount) updateData.amount = data.amount;
  if (data.date) updateData.date = new Date(data.date);
  if (data.proofOfPayment !== undefined) updateData.proofOfPayment = data.proofOfPayment;
  if (data.notes !== undefined) updateData.notes = data.notes;

  if (data.status) {
    updateData.status = data.status;
    updateData.approvedBy = data.status === 'APPROVED' ? user.id : null;
    updateData.approvedAt = data.status === 'APPROVED' ? new Date() : null;
  }

  // Update remittance
  const updatedRemittance = await prisma.remittance.update({
    where: { id },
    data: updateData,
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          licenseNumber: true,
          debtBalance: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          make: true,
          model: true,
        },
      },
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

  return successResponse(serializePrismaResults(updatedRemittance));
});

export const DELETE = withTenantAuth(async ({ prisma, tenantId, request }, { params }) => {
  const { id } = await params;

  // Get existing remittance
  const existingRemittance = await prisma.remittance.findFirst({
    where: {
      id,
      tenantId,
    },
  });

  if (!existingRemittance) {
    return successResponse({ error: 'Remittance not found' }, 404);
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

  return successResponse({ success: true });
});

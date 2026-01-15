import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse } from '@/lib/api-middleware';

export const GET = withTenantAuth(async ({ prisma, tenantId }) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      billingCycle: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      autoRenew: true,
      status: true,
      isInTrial: true,
      trialEndDate: true,
    },
  });

  if (!tenant) {
    return successResponse({ error: 'Tenant not found' }, 404);
  }

  // Get the most recent payment method if any
  const lastPayment = await prisma.payment.findFirst({
    where: {
      invoice: {
        tenantId: tenantId,
      },
      status: 'PAID',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      paymentMethod: true,
    },
  });

  return successResponse({
    plan: tenant.plan,
    billingCycle: tenant.billingCycle,
    subscriptionStartDate: tenant.subscriptionStartDate,
    subscriptionEndDate: tenant.subscriptionEndDate,
    autoRenew: tenant.autoRenew,
    status: tenant.status,
    isInTrial: tenant.isInTrial,
    trialEndDate: tenant.trialEndDate,
    paymentMethod: lastPayment?.paymentMethod || null,
  });
});

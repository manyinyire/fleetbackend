import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse } from '@/lib/api-middleware';

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      monthlyRevenue: true,
    },
  });

  if (!tenant) {
    return successResponse({ error: 'Tenant not found' }, 404);
  }

  // Get plan pricing info
  const planPricing = {
    FREE: { monthly: 0, name: 'Free Plan' },
    BASIC: { monthly: 29.99, name: 'Basic Plan' },
    PREMIUM: { monthly: 99.99, name: 'Premium Plan' },
  };

  const currentPlan = planPricing[tenant.plan];
  const availablePlans = Object.entries(planPricing)
    .filter(([key]) => {
      // Only show plans higher than current plan
      const planOrder = ['FREE', 'BASIC', 'PREMIUM'];
      const currentIndex = planOrder.indexOf(tenant.plan);
      const planIndex = planOrder.indexOf(key);
      return planIndex > currentIndex;
    })
    .map(([key, value]) => ({
      id: key,
      ...value,
    }));

  return successResponse({
    success: true,
    currentPlan: {
      id: tenant.plan,
      ...currentPlan,
      subscriptionStartDate: tenant.subscriptionStartDate,
      subscriptionEndDate: tenant.subscriptionEndDate,
    },
    availableUpgrades: availablePlans,
  });
});

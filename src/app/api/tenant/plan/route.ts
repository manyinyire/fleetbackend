import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse } from '@/lib/api-middleware';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Fetch plan data from PlanConfiguration table
  const allPlans = await prisma.planConfiguration.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      plan: true,
      displayName: true,
      monthlyPrice: true,
      yearlyPrice: true,
      features: true,
      limits: true,
    },
  });

  // Find current plan
  const currentPlanData = allPlans.find((p) => p.plan === tenant.plan);
  
  if (!currentPlanData) {
    return successResponse({ error: 'Current plan not found in database' }, 404);
  }

  // Get available upgrades (plans higher than current)
  const planOrder = ['FREE', 'BASIC', 'PREMIUM'];
  const currentIndex = planOrder.indexOf(tenant.plan);
  
  const availablePlans = allPlans
    .filter((p) => {
      const planIndex = planOrder.indexOf(p.plan);
      return planIndex > currentIndex;
    })
    .map((p) => ({
      id: p.plan,
      name: p.displayName,
      monthly: parseFloat(p.monthlyPrice.toString()),
      yearly: parseFloat(p.yearlyPrice.toString()),
      features: p.features,
      limits: p.limits,
    }));

  return successResponse({
    success: true,
    currentPlan: {
      id: currentPlanData.plan,
      name: currentPlanData.displayName,
      monthly: parseFloat(currentPlanData.monthlyPrice.toString()),
      yearly: parseFloat(currentPlanData.yearlyPrice.toString()),
      subscriptionStartDate: tenant.subscriptionStartDate,
      subscriptionEndDate: tenant.subscriptionEndDate,
    },
    availableUpgrades: availablePlans,
  });
});

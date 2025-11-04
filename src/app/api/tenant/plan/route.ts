import { NextResponse } from 'next/server';
import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { tenantId } = await requireTenantForDashboard();
    
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
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      currentPlan: {
        id: tenant.plan,
        ...currentPlan,
        subscriptionStartDate: tenant.subscriptionStartDate,
        subscriptionEndDate: tenant.subscriptionEndDate,
      },
      availableUpgrades: availablePlans,
    });
  } catch (error) {
    console.error('Error fetching tenant plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan information' },
      { status: 500 }
    );
  }
}


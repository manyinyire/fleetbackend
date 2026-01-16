/**
 * Seed Pricing Plans
 * 
 * This script populates the database with pricing plans for the landing page
 * Run with: npx tsx scripts/seed-pricing-plans.ts
 */

import { PrismaClient, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

const pricingPlans = [
  {
    plan: SubscriptionPlan.FREE,
    displayName: 'Starter',
    description: 'Perfect for small fleets',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD',
    features: [
      'Up to 5 vehicles',
      'Up to 5 drivers',
      'Basic reporting',
      'Mobile app access',
      'Email support'
    ],
    limits: {
      vehicles: 5,
      drivers: 5,
      reports: 'basic',
      support: 'email'
    },
    isActive: true,
    sortOrder: 1
  },
  {
    plan: SubscriptionPlan.BASIC,
    displayName: 'Professional',
    description: 'For growing fleets',
    monthlyPrice: 29,
    yearlyPrice: 290, // ~17% discount
    currency: 'USD',
    features: [
      'Up to 25 vehicles',
      'Unlimited drivers',
      'Advanced analytics',
      'Priority support',
      'Offline mode',
      'Custom reports',
      'API access'
    ],
    limits: {
      vehicles: 25,
      drivers: -1, // unlimited
      reports: 'advanced',
      support: 'priority'
    },
    isActive: true,
    sortOrder: 2
  },
  {
    plan: SubscriptionPlan.PREMIUM,
    displayName: 'Enterprise',
    description: 'For large operations',
    monthlyPrice: 99,
    yearlyPrice: 990, // ~17% discount
    currency: 'USD',
    features: [
      'Unlimited vehicles',
      'Unlimited drivers',
      'White-label option',
      'Dedicated support',
      'Custom integrations',
      'Advanced security',
      'SLA guarantee'
    ],
    limits: {
      vehicles: -1, // unlimited
      drivers: -1, // unlimited
      reports: 'enterprise',
      support: 'dedicated'
    },
    isActive: true,
    sortOrder: 3
  }
];

async function seedPricingPlans() {
  console.log('🌱 Seeding pricing plans...');

  try {
    for (const planData of pricingPlans) {
      const existing = await prisma.planConfiguration.findUnique({
        where: { plan: planData.plan }
      });

      if (existing) {
        console.log(`✓ Plan "${planData.displayName}" already exists, updating...`);
        await prisma.planConfiguration.update({
          where: { plan: planData.plan },
          data: planData
        });
      } else {
        console.log(`+ Creating plan "${planData.displayName}"...`);
        await prisma.planConfiguration.create({
          data: planData
        });
      }
    }

    console.log('\n✅ Pricing plans seeded successfully!');
    console.log(`📊 Total plans: ${pricingPlans.length}`);
    
    // Display summary
    console.log('\n📋 Plans Summary:');
    pricingPlans.forEach(plan => {
      console.log(`  - ${plan.displayName}: $${plan.monthlyPrice}/month`);
    });
  } catch (error) {
    console.error('❌ Error seeding pricing plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPricingPlans();

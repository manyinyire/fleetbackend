import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setSubscriptionDates() {
  console.log('🔄 Setting subscription dates for existing tenants...');

  try {
    // Get all tenants without subscription dates
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { subscriptionStartDate: null },
          { subscriptionEndDate: null }
        ]
      }
    });

    console.log(`📊 Found ${tenants.length} tenants without subscription dates`);

    if (tenants.length === 0) {
      console.log('✅ All tenants already have subscription dates!');
      return;
    }

    // Update each tenant
    for (const tenant of tenants) {
      const startDate = tenant.subscriptionStartDate || tenant.createdAt;
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
        }
      });

      console.log(`✅ Updated ${tenant.name}: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`);
    }

    console.log(`\n🎉 Successfully updated ${tenants.length} tenants!`);
  } catch (error) {
    console.error('❌ Error setting subscription dates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setSubscriptionDates()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedTenants() {
  console.log('Starting cleanup of orphaned tenants...\n');

  try {
    // Find all tenants
    const allTenants = await prisma.tenant.findMany({
      include: {
        users: true,
        settings: true,
      },
    });

    console.log(`Found ${allTenants.length} total tenants\n`);

    // Find tenants without users
    const orphanedTenants = allTenants.filter(tenant => tenant.users.length === 0);

    console.log(`Found ${orphanedTenants.length} orphaned tenants (no users):\n`);

    for (const tenant of orphanedTenants) {
      console.log(`- ID: ${tenant.id}`);
      console.log(`  Name: ${tenant.name}`);
      console.log(`  Slug: ${tenant.slug}`);
      console.log(`  Email: ${tenant.email}`);
      console.log(`  Created: ${tenant.createdAt}`);
      console.log('');
    }

    // Prompt for deletion (you can uncomment this section to enable automatic deletion)
    if (orphanedTenants.length > 0) {
      console.log('To delete these orphaned tenants, uncomment the deletion code in this script.\n');

      // UNCOMMENT BELOW TO AUTO-DELETE ORPHANED TENANTS
      
      for (const tenant of orphanedTenants) {
        // Delete tenant settings first
        if (tenant.settings) {
          await prisma.tenantSettings.delete({
            where: { tenantId: tenant.id },
          });
          console.log(`Deleted settings for tenant: ${tenant.name}`);
        }

        // Delete tenant
        await prisma.tenant.delete({
          where: { id: tenant.id },
        });
        console.log(`Deleted tenant: ${tenant.name}`);
      }
      console.log(`\nDeleted ${orphanedTenants.length} orphaned tenants`);
    }

    // Show duplicate slugs
    const slugCounts = allTenants.reduce((acc, tenant) => {
      acc[tenant.slug] = (acc[tenant.slug] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicateSlugs = Object.entries(slugCounts)
      .filter(([_, count]) => count > 1)
      .map(([slug, count]) => ({ slug, count }));

    if (duplicateSlugs.length > 0) {
      console.log('\nFound duplicate slugs:');
      for (const { slug, count } of duplicateSlugs) {
        console.log(`- ${slug}: ${count} tenants`);
        const duplicates = allTenants.filter(t => t.slug === slug);
        duplicates.forEach(t => {
          console.log(`  - ${t.id} (${t.users.length} users)`);
        });
      }
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedTenants();

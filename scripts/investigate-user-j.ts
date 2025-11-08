import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Investigating User "j" ===\n');

  // Find users matching 'j'
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'j', mode: 'insensitive' } },
        { name: { contains: 'j', mode: 'insensitive' } },
        { email: { equals: 'j' } },
      ],
    },
    include: {
      tenant: true,
      sessions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Found ${users.length} user(s) matching "j"\n`);

  // Check for users without tenantId (excluding SUPER_ADMIN)
  const usersWithoutTenant = users.filter(
    u => !u.tenantId && u.role !== 'SUPER_ADMIN'
  );

  if (usersWithoutTenant.length > 0) {
    console.log('⚠️  USERS WITHOUT TENANT (DATA INTEGRITY ISSUE):');
    console.log('='.repeat(60));
    usersWithoutTenant.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role || 'NULL'}`);
      console.log(`  Email Verified: ${user.emailVerified}`);
      console.log(`  Tenant ID: ${user.tenantId || 'NULL ❌'}`);
      console.log(`  Created: ${user.createdAt.toISOString()}`);
      console.log(`  Last Login: ${user.lastLoginAt?.toISOString() || 'Never'}`);
      console.log(`  Has Sessions: ${user.sessions.length > 0 ? 'Yes' : 'No'}`);
    });
    console.log('\n' + '='.repeat(60));
  }

  // Display all users with their tenant info
  console.log('\n\nALL USERS MATCHING "j":');
  console.log('='.repeat(60));
  users.forEach((user, index) => {
    console.log(`\nUser ${index + 1}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role || 'user'}`);
    console.log(`  Email Verified: ${user.emailVerified}`);
    console.log(`  Tenant ID: ${user.tenantId || 'NULL'}`);
    if (user.tenant) {
      console.log(`  Tenant Name: ${user.tenant.name}`);
      console.log(`  Tenant Slug: ${user.tenant.slug}`);
      console.log(`  Tenant Status: ${user.tenant.status}`);
    }
    console.log(`  Created: ${user.createdAt.toISOString()}`);
  });
  console.log('\n' + '='.repeat(60));

  // Check if there are any tenants that might belong to this user
  if (usersWithoutTenant.length > 0) {
    console.log('\n\nPOTENTIAL TENANTS FOR ORPHANED USERS:');
    console.log('='.repeat(60));

    for (const user of usersWithoutTenant) {
      const potentialTenants = await prisma.tenant.findMany({
        where: {
          OR: [
            { email: user.email },
            { email: { contains: user.email.split('@')[0] } },
          ],
        },
      });

      if (potentialTenants.length > 0) {
        console.log(`\nFor user ${user.email}:`);
        potentialTenants.forEach((tenant, idx) => {
          console.log(`  ${idx + 1}. ${tenant.name} (${tenant.slug})`);
          console.log(`     Email: ${tenant.email}`);
          console.log(`     Status: ${tenant.status}`);
          console.log(`     Created: ${tenant.createdAt.toISOString()}`);
        });
      } else {
        console.log(`\nNo potential tenants found for ${user.email}`);
      }
    }
    console.log('\n' + '='.repeat(60));
  }

  // Recommendations
  if (usersWithoutTenant.length > 0) {
    console.log('\n\n📋 RECOMMENDATIONS:\n');
    usersWithoutTenant.forEach((user) => {
      console.log(`For ${user.email}:`);
      if (user.role === 'user' || user.role === 'USER' || !user.role) {
        console.log(`  Option 1: Assign to an existing tenant if they should have access`);
        console.log(`  Option 2: Delete this user if they were created by mistake`);
        console.log(`  Option 3: Promote to SUPER_ADMIN if they should be a super admin`);
      } else {
        console.log(`  ⚠️  This user has role "${user.role}" but no tenant - likely a data issue`);
        console.log(`  Option 1: Assign to an existing tenant`);
        console.log(`  Option 2: Delete this user and recreate properly`);
      }
      console.log('');
    });
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

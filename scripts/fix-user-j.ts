import { PrismaClient } from '@prisma/client';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const prisma = new PrismaClient();
const rl = readline.createInterface({ input, output });

async function main() {
  console.log('\n=== Fix User "j" ===\n');

  // Find the user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'j' },
        { email: { contains: 'j', mode: 'insensitive' } },
      ],
    },
    include: {
      tenant: true,
    },
  });

  if (!user) {
    console.log('❌ No user found matching "j"');
    console.log('\nTrying to find all users...');
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true, tenantId: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.table(allUsers);
    return;
  }

  console.log('Found user:');
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Role: ${user.role || 'user'}`);
  console.log(`  Tenant ID: ${user.tenantId || 'NULL ❌'}`);
  console.log(`  Email Verified: ${user.emailVerified}`);

  // Check if user already has a tenant
  if (user.tenantId && user.tenant) {
    console.log('\n✅ User already has a tenant:');
    console.log(`  Tenant: ${user.tenant.name}`);
    console.log(`  Status: ${user.tenant.status}`);
    console.log('\nNo fix needed. The issue might be elsewhere.');
    return;
  }

  // Check if user is SUPER_ADMIN
  if (user.role === 'SUPER_ADMIN') {
    console.log('\n✅ User is SUPER_ADMIN (no tenant needed)');
    console.log('No fix needed. The issue might be elsewhere.');
    return;
  }

  // User doesn't have a tenant - this is the problem!
  console.log('\n⚠️  DATA INTEGRITY ISSUE: User has no tenant!\n');

  // Check for potential tenants
  const potentialTenants = await prisma.tenant.findMany({
    where: {
      email: user.email,
    },
  });

  console.log('Options to fix this:\n');
  console.log('1. Make user a SUPER_ADMIN (no tenant required)');
  console.log('2. Create a new tenant for this user');

  if (potentialTenants.length > 0) {
    console.log('3. Assign to an existing tenant with matching email:');
    potentialTenants.forEach((t, idx) => {
      console.log(`   ${idx + 1}. ${t.name} (${t.slug}) - ${t.status}`);
    });
  }

  const answer = await rl.question('\nEnter your choice (1, 2, or 3): ');

  if (answer === '1') {
    // Make SUPER_ADMIN
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'SUPER_ADMIN' },
    });
    console.log('\n✅ User updated to SUPER_ADMIN');
    console.log('User "j" can now log in and access /superadmin/dashboard');
  } else if (answer === '2') {
    // Create new tenant
    const companyName = await rl.question('Enter company name: ');
    const phone = await rl.question('Enter phone number (+263 77 123 4567): ');

    // Generate unique slug
    const baseSlug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.tenant.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        email: user.email,
        phone: phone || '+263 77 123 4567',
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });

    // Create tenant settings
    await prisma.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        companyName,
        email: user.email,
        phone: phone || '+263 77 123 4567',
      },
    });

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tenantId: tenant.id,
        role: user.role || 'TENANT_ADMIN',
      },
    });

    console.log('\n✅ Tenant created and assigned to user');
    console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
    console.log('User can now log in and access /dashboard');
  } else if (answer === '3' && potentialTenants.length > 0) {
    const tenantIndex = parseInt(await rl.question('Enter tenant number: ')) - 1;
    const selectedTenant = potentialTenants[tenantIndex];

    if (selectedTenant) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tenantId: selectedTenant.id,
          role: user.role || 'TENANT_ADMIN',
        },
      });

      console.log('\n✅ User assigned to tenant');
      console.log(`Tenant: ${selectedTenant.name}`);
      console.log('User can now log in and access /dashboard');
    } else {
      console.log('❌ Invalid tenant selection');
    }
  } else {
    console.log('❌ Invalid choice');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });

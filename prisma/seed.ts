import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create SUPER_ADMIN user if not exists
  const superAdminEmail = 'superadmin@azaire.com';
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    try {
      // Get super admin password from environment variable or generate a secure random one
      const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

      if (!superAdminPassword) {
        console.error('❌ SUPER_ADMIN_PASSWORD environment variable is not set');
        console.error('   Please set SUPER_ADMIN_PASSWORD in your .env file');
        console.error('   Example: SUPER_ADMIN_PASSWORD=YourSecurePassword123!');
        throw new Error('SUPER_ADMIN_PASSWORD environment variable is required for seeding');
      }

      // Hash the password
      const hashedPassword = await hash(superAdminPassword, 12);

      // Create SUPER_ADMIN user
      const superAdminUser = await prisma.user.create({
        data: {
          email: superAdminEmail,
          name: 'Super Admin',
          emailVerified: true, // Super admin is pre-verified
          role: 'SUPER_ADMIN',
        },
      });

      // Create credential account for BetterAuth
      await prisma.account.create({
        data: {
          userId: superAdminUser.id,
          accountId: superAdminUser.id, // Use user ID as account ID
          providerId: 'credential', // BetterAuth credential provider
          password: hashedPassword,
        },
      });

      console.log('✅ Created SUPER_ADMIN user and credentials');
      console.log('   Email:', superAdminEmail);
      console.log('   ⚠️  Password set from SUPER_ADMIN_PASSWORD environment variable');
      console.log('   ⚠️  Please store the password securely and change it after first login!');
    } catch (error) {
      console.error('❌ Error creating super admin:', error);
      throw error;
    }
  } else {
    console.log('✅ SUPER_ADMIN user already exists');

    // Check if account exists for existing super admin
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: existingSuperAdmin.id,
        providerId: 'credential',
      },
    });

    if (!existingAccount) {
      console.log('⚠️  Super admin exists but has no credential account. Creating one...');
      const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

      if (!superAdminPassword) {
        console.error('❌ SUPER_ADMIN_PASSWORD environment variable is not set');
        throw new Error('SUPER_ADMIN_PASSWORD required to create credential account');
      }

      const hashedPassword = await hash(superAdminPassword, 12);

      await prisma.account.create({
        data: {
          userId: existingSuperAdmin.id,
          accountId: existingSuperAdmin.id,
          providerId: 'credential',
          password: hashedPassword,
        },
      });

      console.log('✅ Created credential account for existing super admin');
    }
  }

  // Create a sample tenant
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo-fleet-company' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Demo Fleet Company',
        slug: 'demo-fleet-company',
        email: 'demo@example.com',
        phone: '+263 77 123 4567',
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Created tenant:', tenant.name);
  } else {
    console.log('✅ Tenant already exists:', tenant.name);
  }

  // Create tenant settings
  const existingSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id }
  });

  if (!existingSettings) {
    await prisma.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        companyName: 'Demo Fleet Company',
        email: 'demo@example.com',
        phone: '+263 77 123 4567',
        primaryColor: '#1e3a8a',
        invoicePrefix: 'INV',
        currency: 'USD',
        timezone: 'Africa/Harare',
        dateFormat: 'YYYY-MM-DD',
        country: 'Zimbabwe',
      },
    });
    console.log('✅ Created tenant settings');
  } else {
    console.log('✅ Tenant settings already exist');
  }

  // Create sample vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        tenantId: tenant.id,
        registrationNumber: 'ABC-1234',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        type: 'CAR',
        initialCost: 15000,
        currentMileage: 45000,
        status: 'ACTIVE',
        paymentModel: 'DRIVER_REMITS',
        paymentConfig: { targetAmount: 100 },
      },
    }),
    prisma.vehicle.create({
      data: {
        tenantId: tenant.id,
        registrationNumber: 'XYZ-5678',
        make: 'Nissan',
        model: 'Urvan',
        year: 2019,
        type: 'OMNIBUS',
        initialCost: 25000,
        currentMileage: 78000,
        status: 'ACTIVE',
        paymentModel: 'OWNER_PAYS',
        paymentConfig: {},
      },
    }),
  ]);

  console.log('✅ Created vehicles:', vehicles.length);

  // Create sample drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        tenantId: tenant.id,
        fullName: 'John Doe',
        nationalId: '1234567890',
        licenseNumber: 'DL123456789',
        phone: '+263 77 111 1111',
        email: 'john@example.com',
        homeAddress: '123 Main Street, Harare',
        nextOfKin: 'Mary Doe',
        nextOfKinPhone: '+263 77 111 1112',
        debtBalance: 0,
        status: 'ACTIVE',
      },
    }),
    prisma.driver.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Jane Smith',
        nationalId: '0987654321',
        licenseNumber: 'DL987654321',
        phone: '+263 77 222 2222',
        email: 'jane@example.com',
        homeAddress: '456 Oak Avenue, Bulawayo',
        nextOfKin: 'Bob Smith',
        nextOfKinPhone: '+263 77 222 2223',
        debtBalance: 0,
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log('✅ Created drivers:', drivers.length);

  // Create driver-vehicle assignments
  await Promise.all([
    prisma.driverVehicleAssignment.create({
      data: {
        tenantId: tenant.id,
        driverId: drivers[0].id,
        vehicleId: vehicles[0].id,
        isPrimary: true,
        startDate: new Date('2024-01-01'),
      },
    }),
    prisma.driverVehicleAssignment.create({
      data: {
        tenantId: tenant.id,
        driverId: drivers[1].id,
        vehicleId: vehicles[1].id,
        isPrimary: true,
        startDate: new Date('2024-01-01'),
      },
    }),
  ]);

  console.log('✅ Created driver-vehicle assignments');

  // Create sample remittances
  const remittances = await Promise.all([
    prisma.remittance.create({
      data: {
        tenantId: tenant.id,
        driverId: drivers[0].id,
        vehicleId: vehicles[0].id,
        amount: 100,
        date: new Date('2024-10-20'),
        status: 'APPROVED',
        notes: 'Weekly remittance',
      },
    }),
    prisma.remittance.create({
      data: {
        tenantId: tenant.id,
        driverId: drivers[1].id,
        vehicleId: vehicles[1].id,
        amount: 150,
        date: new Date('2024-10-21'),
        status: 'PENDING',
        notes: 'Weekly remittance',
      },
    }),
  ]);

  console.log('✅ Created remittances:', remittances.length);

  // Create sample maintenance records
  const maintenance = await Promise.all([
    prisma.maintenanceRecord.create({
      data: {
        tenantId: tenant.id,
        vehicleId: vehicles[0].id,
        date: new Date('2024-10-15'),
        mileage: 44000,
        type: 'ROUTINE_SERVICE',
        description: 'Oil change and filter replacement',
        cost: 50,
        provider: 'Auto Service Center',
      },
    }),
    prisma.maintenanceRecord.create({
      data: {
        tenantId: tenant.id,
        vehicleId: vehicles[1].id,
        date: new Date('2024-10-10'),
        mileage: 77000,
        type: 'TIRE_REPLACEMENT',
        description: 'Replaced all 4 tires',
        cost: 200,
        provider: 'Tire Shop',
      },
    }),
  ]);

  console.log('✅ Created maintenance records:', maintenance.length);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
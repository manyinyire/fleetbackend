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
      // Create SUPER_ADMIN user directly with Prisma
      const hashedPassword = await hash('SuperAdmin@123!', 12);
      
      await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          name: 'Super Admin',
        },
      });

      // Update the user role to SUPER_ADMIN
      await prisma.user.update({
        where: { email: superAdminEmail },
        data: { role: 'SUPER_ADMIN' },
      });

      console.log('✅ Created SUPER_ADMIN user');
      console.log('   Email:', superAdminEmail);
      console.log('   Password: SuperAdmin@123!');
      console.log('   ⚠️  Please change the password after first login!');
    } catch (error) {
      console.error('❌ Error creating super admin:', error);
    }
  } else {
    console.log('✅ SUPER_ADMIN user already exists');
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
        paymentModel: 'DRIVER_REMITS',
        paymentConfig: { targetAmount: 100 },
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
        paymentModel: 'OWNER_PAYS',
        paymentConfig: { percentage: 15 },
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
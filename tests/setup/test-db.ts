import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test database utilities
export async function cleanupDatabase() {
  // Delete in reverse order of dependencies
  await prisma.auditLog.deleteMany()
  await prisma.remittance.deleteMany()
  await prisma.income.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.maintenanceRecord.deleteMany()
  await prisma.driverVehicleAssignment.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenantSettings.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.tenant.deleteMany()
}

export async function createTestTenant(data: Partial<any> = {}) {
  return await prisma.tenant.create({
    data: {
      name: data.name || 'Test Company',
      slug: data.slug || 'test-company',
      email: data.email || 'test@example.com',
      phone: data.phone || '+1234567890',
      plan: data.plan || 'FREE',
      status: data.status || 'ACTIVE',
    },
  })
}

export async function createTestUser(data: Partial<any> = {}) {
  const tenant = data.tenantId ? null : await createTestTenant()
  
  return await prisma.user.create({
    data: {
      email: data.email || 'user@example.com',
      name: data.name || 'Test User',
      password: data.password || 'hashedpassword',
      role: data.role || 'TENANT_ADMIN',
      tenantId: data.tenantId || tenant?.id,
    },
  })
}

export async function createTestVehicle(data: Partial<any> = {}) {
  const tenant = data.tenantId ? null : await createTestTenant()
  
  return await prisma.vehicle.create({
    data: {
      registrationNumber: data.registrationNumber || 'ABC123',
      make: data.make || 'Toyota',
      model: data.model || 'Camry',
      year: data.year || 2020,
      type: data.type || 'SEDAN',
      initialCost: data.initialCost || 25000,
      currentMileage: data.currentMileage || 0,
      status: data.status || 'ACTIVE',
      tenantId: data.tenantId || tenant?.id,
    },
  })
}

export async function createTestDriver(data: Partial<any> = {}) {
  const tenant = data.tenantId ? null : await createTestTenant()
  
  return await prisma.driver.create({
    data: {
      fullName: data.fullName || 'John Doe',
      nationalId: data.nationalId || '123456789',
      licenseNumber: data.licenseNumber || 'LIC123456',
      licenseExpiry: data.licenseExpiry || new Date('2025-12-31'),
      phone: data.phone || '+1234567890',
      email: data.email || 'driver@example.com',
      paymentModel: data.paymentModel || 'FIXED',
      paymentConfig: data.paymentConfig || {},
      debtBalance: data.debtBalance || 0,
      status: data.status || 'ACTIVE',
      tenantId: data.tenantId || tenant?.id,
    },
  })
}

export async function createTestSession(data: Partial<any> = {}) {
  const user = data.userId ? null : await createTestUser()
  
  return await prisma.session.create({
    data: {
      id: data.id || 'test-session-id',
      userId: data.userId || user?.id,
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      token: data.token || 'test-token',
    },
  })
}
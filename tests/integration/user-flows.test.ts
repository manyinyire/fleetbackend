import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireTenant: jest.fn(),
  requireRole: jest.fn(),
}))

// Mock tenant utilities
jest.mock('@/lib/get-tenant-prisma', () => ({
  getTenantPrisma: jest.fn(),
}))

jest.mock('@/lib/tenant', () => ({
  setTenantContext: jest.fn(),
}))

describe('User Flow Integration Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('Complete Tenant Onboarding Flow', () => {
    it('should complete full tenant onboarding process', async () => {
      // 1. Create tenant
      const tenant = await createTestTenant({
        name: 'Test Fleet Company',
        email: 'fleet@test.com',
        plan: 'FREE',
        status: 'ACTIVE'
      })

      expect(tenant).toBeTruthy()
      expect(tenant.name).toBe('Test Fleet Company')
      expect(tenant.slug).toBe('test-fleet-company')

      // 2. Create tenant admin user
      const adminUser = await createTestUser({
        tenantId: tenant.id,
        email: 'admin@test.com',
        name: 'Fleet Admin',
        role: 'TENANT_ADMIN'
      })

      expect(adminUser).toBeTruthy()
      expect(adminUser.role).toBe('TENANT_ADMIN')
      expect(adminUser.tenantId).toBe(tenant.id)

      // 3. Create tenant settings
      const settings = await prisma.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          companyName: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
        }
      })

      expect(settings).toBeTruthy()
      expect(settings.companyName).toBe(tenant.name)

      // 4. Add vehicles
      const vehicle1 = await prisma.vehicle.create({
        data: {
          registrationNumber: 'ABC123',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: 'SEDAN',
          initialCost: 25000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        }
      })

      const vehicle2 = await prisma.vehicle.create({
        data: {
          registrationNumber: 'XYZ789',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          type: 'SEDAN',
          initialCost: 22000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        }
      })

      expect(vehicle1).toBeTruthy()
      expect(vehicle2).toBeTruthy()

      // 5. Add drivers
      const driver1 = await prisma.driver.create({
        data: {
          fullName: 'John Driver',
          nationalId: '123456789',
          licenseNumber: 'LIC123456',
          licenseExpiry: new Date('2025-12-31'),
          phone: '+1234567890',
          email: 'john@test.com',
          paymentModel: 'FIXED',
          paymentConfig: { amount: 1000 },
          debtBalance: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        }
      })

      const driver2 = await prisma.driver.create({
        data: {
          fullName: 'Jane Driver',
          nationalId: '987654321',
          licenseNumber: 'LIC789012',
          licenseExpiry: new Date('2025-12-31'),
          phone: '+1234567891',
          email: 'jane@test.com',
          paymentModel: 'PERCENTAGE',
          paymentConfig: { percentage: 15 },
          debtBalance: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        }
      })

      expect(driver1).toBeTruthy()
      expect(driver2).toBeTruthy()

      // 6. Assign drivers to vehicles
      const assignment1 = await prisma.driverVehicleAssignment.create({
        data: {
          driverId: driver1.id,
          vehicleId: vehicle1.id,
          assignedAt: new Date(),
          status: 'ACTIVE',
        }
      })

      const assignment2 = await prisma.driverVehicleAssignment.create({
        data: {
          driverId: driver2.id,
          vehicleId: vehicle2.id,
          assignedAt: new Date(),
          status: 'ACTIVE',
        }
      })

      expect(assignment1).toBeTruthy()
      expect(assignment2).toBeTruthy()

      // 7. Verify complete setup
      const tenantWithData = await prisma.tenant.findUnique({
        where: { id: tenant.id },
        include: {
          users: true,
          vehicles: true,
          drivers: true,
          settings: true,
        }
      })

      expect(tenantWithData?.users).toHaveLength(1)
      expect(tenantWithData?.vehicles).toHaveLength(2)
      expect(tenantWithData?.drivers).toHaveLength(2)
      expect(tenantWithData?.settings).toBeTruthy()

      // 8. Verify driver-vehicle relationships
      const assignments = await prisma.driverVehicleAssignment.findMany({
        where: { driverId: { in: [driver1.id, driver2.id] } },
        include: {
          driver: true,
          vehicle: true,
        }
      })

      expect(assignments).toHaveLength(2)
      expect(assignments[0].driver.fullName).toBe('John Driver')
      expect(assignments[0].vehicle.registrationNumber).toBe('ABC123')
      expect(assignments[1].driver.fullName).toBe('Jane Driver')
      expect(assignments[1].vehicle.registrationNumber).toBe('XYZ789')
    })
  })

  describe('Financial Operations Flow', () => {
    it('should handle complete financial operations', async () => {
      const tenant = await createTestTenant()
      const vehicle = await prisma.vehicle.create({
        data: {
          registrationNumber: 'FIN123',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: 'SEDAN',
          initialCost: 25000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        }
      })

      const driver = await prisma.driver.create({
        data: {
          fullName: 'Financial Driver',
          nationalId: '123456789',
          licenseNumber: 'LIC123456',
          licenseExpiry: new Date('2025-12-31'),
          phone: '+1234567890',
          email: 'financial@test.com',
          paymentModel: 'FIXED',
          paymentConfig: { amount: 1000 },
          debtBalance: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        }
      })

      // 1. Record income
      const income = await prisma.income.create({
        data: {
          amount: 5000,
          description: 'Trip revenue',
          date: new Date(),
          vehicleId: vehicle.id,
          driverId: driver.id,
          tenantId: tenant.id,
        }
      })

      expect(income).toBeTruthy()
      expect(income.amount).toBe(5000)

      // 2. Record expenses
      const expense1 = await prisma.expense.create({
        data: {
          amount: 200,
          description: 'Fuel',
          category: 'FUEL',
          date: new Date(),
          vehicleId: vehicle.id,
          driverId: driver.id,
          status: 'APPROVED',
          tenantId: tenant.id,
        }
      })

      const expense2 = await prisma.expense.create({
        data: {
          amount: 100,
          description: 'Maintenance',
          category: 'MAINTENANCE',
          date: new Date(),
          vehicleId: vehicle.id,
          driverId: driver.id,
          status: 'PENDING',
          tenantId: tenant.id,
        }
      })

      expect(expense1).toBeTruthy()
      expect(expense2).toBeTruthy()

      // 3. Record remittance
      const remittance = await prisma.remittance.create({
        data: {
          amount: 1000,
          description: 'Driver payment',
          date: new Date(),
          vehicleId: vehicle.id,
          driverId: driver.id,
          status: 'PENDING',
          tenantId: tenant.id,
        }
      })

      expect(remittance).toBeTruthy()
      expect(remittance.amount).toBe(1000)

      // 4. Verify financial summary
      const totalIncome = await prisma.income.aggregate({
        where: { tenantId: tenant.id },
        _sum: { amount: true }
      })

      const totalExpenses = await prisma.expense.aggregate({
        where: { 
          tenantId: tenant.id,
          status: 'APPROVED'
        },
        _sum: { amount: true }
      })

      const totalRemittances = await prisma.remittance.aggregate({
        where: { tenantId: tenant.id },
        _sum: { amount: true }
      })

      expect(totalIncome._sum.amount).toBe(5000)
      expect(totalExpenses._sum.amount).toBe(200)
      expect(totalRemittances._sum.amount).toBe(1000)

      // 5. Calculate net profit
      const netProfit = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0)
      expect(netProfit).toBe(4800)
    })
  })

  describe('Audit Trail Flow', () => {
    it('should maintain complete audit trail', async () => {
      const tenant = await createTestTenant()
      const user = await createTestUser({ tenantId: tenant.id })

      // 1. Create audit logs for various actions
      const auditLogs = await Promise.all([
        prisma.auditLog.create({
          data: {
            action: 'TENANT_CREATED',
            details: 'New tenant created',
            userId: user.id,
            tenantId: tenant.id,
            severity: 'INFO',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'USER_CREATED',
            details: 'New user created',
            userId: user.id,
            tenantId: tenant.id,
            severity: 'INFO',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'VEHICLE_CREATED',
            details: 'New vehicle added',
            userId: user.id,
            tenantId: tenant.id,
            severity: 'INFO',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'DRIVER_CREATED',
            details: 'New driver added',
            userId: user.id,
            tenantId: tenant.id,
            severity: 'INFO',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'LOGIN_FAILED',
            details: 'Failed login attempt',
            userId: user.id,
            tenantId: tenant.id,
            severity: 'WARNING',
          }
        })
      ])

      expect(auditLogs).toHaveLength(5)

      // 2. Verify audit log queries
      const allLogs = await prisma.auditLog.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' }
      })

      expect(allLogs).toHaveLength(5)

      // 3. Filter by severity
      const warningLogs = await prisma.auditLog.findMany({
        where: { 
          tenantId: tenant.id,
          severity: 'WARNING'
        }
      })

      expect(warningLogs).toHaveLength(1)
      expect(warningLogs[0].action).toBe('LOGIN_FAILED')

      // 4. Filter by action type
      const creationLogs = await prisma.auditLog.findMany({
        where: { 
          tenantId: tenant.id,
          action: { contains: 'CREATED' }
        }
      })

      expect(creationLogs).toHaveLength(4)

      // 5. Get recent activity (last 24 hours)
      const recentLogs = await prisma.auditLog.findMany({
        where: { 
          tenantId: tenant.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      expect(recentLogs).toHaveLength(5)
    })
  })

  describe('Multi-tenant Data Isolation', () => {
    it('should ensure proper data isolation between tenants', async () => {
      // Create two tenants
      const tenant1 = await createTestTenant({ name: 'Company 1' })
      const tenant2 = await createTestTenant({ name: 'Company 2' })

      // Create users for each tenant
      const user1 = await createTestUser({ tenantId: tenant1.id, email: 'user1@company1.com' })
      const user2 = await createTestUser({ tenantId: tenant2.id, email: 'user2@company2.com' })

      // Create vehicles for each tenant
      const vehicle1 = await prisma.vehicle.create({
        data: {
          registrationNumber: 'TENANT1-001',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: 'SEDAN',
          initialCost: 25000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant1.id,
        }
      })

      const vehicle2 = await prisma.vehicle.create({
        data: {
          registrationNumber: 'TENANT2-001',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          type: 'SEDAN',
          initialCost: 22000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant2.id,
        }
      })

      // Verify tenant 1 can only see their data
      const tenant1Vehicles = await prisma.vehicle.findMany({
        where: { tenantId: tenant1.id }
      })

      expect(tenant1Vehicles).toHaveLength(1)
      expect(tenant1Vehicles[0].registrationNumber).toBe('TENANT1-001')

      // Verify tenant 2 can only see their data
      const tenant2Vehicles = await prisma.vehicle.findMany({
        where: { tenantId: tenant2.id }
      })

      expect(tenant2Vehicles).toHaveLength(1)
      expect(tenant2Vehicles[0].registrationNumber).toBe('TENANT2-001')

      // Verify cross-tenant data access is prevented
      const crossTenantVehicles = await prisma.vehicle.findMany({
        where: { 
          tenantId: tenant1.id,
          registrationNumber: 'TENANT2-001'
        }
      })

      expect(crossTenantVehicles).toHaveLength(0)
    })
  })
})
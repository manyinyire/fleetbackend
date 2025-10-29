import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'

describe('Database Performance Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('Query Performance', () => {
    it('should efficiently query large datasets', async () => {
      const tenant = await createTestTenant()
      
      // Create large dataset
      const vehicles = []
      const drivers = []
      
      for (let i = 0; i < 1000; i++) {
        vehicles.push({
          registrationNumber: `VEH${i.toString().padStart(4, '0')}`,
          make: 'Toyota',
          model: 'Camry',
          year: 2020 + (i % 5),
          type: 'SEDAN',
          initialCost: 20000 + (i * 100),
          currentMileage: i * 1000,
          status: 'ACTIVE',
          tenantId: tenant.id,
        })
      }

      for (let i = 0; i < 500; i++) {
        drivers.push({
          fullName: `Driver ${i}`,
          nationalId: `${i.toString().padStart(9, '0')}`,
          licenseNumber: `LIC${i.toString().padStart(6, '0')}`,
          licenseExpiry: new Date('2025-12-31'),
          phone: `+1234567${i.toString().padStart(3, '0')}`,
          email: `driver${i}@test.com`,
          paymentModel: 'FIXED',
          paymentConfig: { amount: 1000 },
          debtBalance: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        })
      }

      // Bulk insert vehicles
      const startTime = Date.now()
      await prisma.vehicle.createMany({
        data: vehicles
      })
      const vehicleInsertTime = Date.now() - startTime

      // Bulk insert drivers
      const driverStartTime = Date.now()
      await prisma.driver.createMany({
        data: drivers
      })
      const driverInsertTime = Date.now() - driverStartTime

      expect(vehicleInsertTime).toBeLessThan(5000) // Should complete within 5 seconds
      expect(driverInsertTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Test query performance
      const queryStartTime = Date.now()
      const vehiclesWithDrivers = await prisma.vehicle.findMany({
        where: { tenantId: tenant.id },
        include: {
          drivers: {
            include: {
              driver: true
            }
          }
        },
        take: 100,
        orderBy: { createdAt: 'desc' }
      })
      const queryTime = Date.now() - queryStartTime

      expect(queryTime).toBeLessThan(1000) // Should complete within 1 second
      expect(vehiclesWithDrivers).toHaveLength(100)
    })

    it('should efficiently handle pagination', async () => {
      const tenant = await createTestTenant()
      
      // Create test data
      const vehicles = []
      for (let i = 0; i < 100; i++) {
        vehicles.push({
          registrationNumber: `PAG${i.toString().padStart(3, '0')}`,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: 'SEDAN',
          initialCost: 25000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        })
      }

      await prisma.vehicle.createMany({ data: vehicles })

      // Test pagination performance
      const pageSize = 20
      const totalPages = Math.ceil(vehicles.length / pageSize)

      for (let page = 1; page <= totalPages; page++) {
        const startTime = Date.now()
        const result = await prisma.vehicle.findMany({
          where: { tenantId: tenant.id },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' }
        })
        const queryTime = Date.now() - startTime

        expect(queryTime).toBeLessThan(100) // Each page should load within 100ms
        expect(result).toHaveLength(pageSize)
      }
    })

    it('should efficiently handle complex aggregations', async () => {
      const tenant = await createTestTenant()
      
      // Create test financial data
      const incomes = []
      const expenses = []
      
      for (let i = 0; i < 1000; i++) {
        incomes.push({
          amount: 1000 + (i * 10),
          description: `Income ${i}`,
          date: new Date(2024, 0, 1 + (i % 365)),
          tenantId: tenant.id,
        })
        
        expenses.push({
          amount: 500 + (i * 5),
          description: `Expense ${i}`,
          category: 'FUEL',
          date: new Date(2024, 0, 1 + (i % 365)),
          status: 'APPROVED',
          tenantId: tenant.id,
        })
      }

      await prisma.income.createMany({ data: incomes })
      await prisma.expense.createMany({ data: expenses })

      // Test aggregation performance
      const startTime = Date.now()
      const [totalIncome, totalExpenses, monthlyBreakdown] = await Promise.all([
        prisma.income.aggregate({
          where: { tenantId: tenant.id },
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.expense.aggregate({
          where: { 
            tenantId: tenant.id,
            status: 'APPROVED'
          },
          _sum: { amount: true },
          _count: { id: true }
        }),
        prisma.income.groupBy({
          by: ['date'],
          where: { tenantId: tenant.id },
          _sum: { amount: true },
          orderBy: { date: 'asc' }
        })
      ])
      const queryTime = Date.now() - startTime

      expect(queryTime).toBeLessThan(2000) // Should complete within 2 seconds
      expect(totalIncome._count.id).toBe(1000)
      expect(totalExpenses._count.id).toBe(1000)
      expect(monthlyBreakdown).toHaveLength(365)
    })
  })

  describe('Database Indexing', () => {
    it('should efficiently query by indexed fields', async () => {
      const tenant = await createTestTenant()
      
      // Create test data with various statuses
      const vehicles = []
      for (let i = 0; i < 100; i++) {
        vehicles.push({
          registrationNumber: `IDX${i.toString().padStart(3, '0')}`,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: 'SEDAN',
          initialCost: 25000,
          currentMileage: 0,
          status: i % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
          tenantId: tenant.id,
        })
      }

      await prisma.vehicle.createMany({ data: vehicles })

      // Test query by status (should use index)
      const startTime = Date.now()
      const activeVehicles = await prisma.vehicle.findMany({
        where: { 
          tenantId: tenant.id,
          status: 'ACTIVE'
        }
      })
      const queryTime = Date.now() - startTime

      expect(queryTime).toBeLessThan(50) // Should be very fast with index
      expect(activeVehicles).toHaveLength(50)
    })

    it('should efficiently query by tenant ID (primary index)', async () => {
      const tenant1 = await createTestTenant({ name: 'Company 1' })
      const tenant2 = await createTestTenant({ name: 'Company 2' })
      
      // Create data for both tenants
      const vehicles1 = []
      const vehicles2 = []
      
      for (let i = 0; i < 50; i++) {
        vehicles1.push({
          registrationNumber: `T1-${i.toString().padStart(3, '0')}`,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: 'SEDAN',
          initialCost: 25000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant1.id,
        })
        
        vehicles2.push({
          registrationNumber: `T2-${i.toString().padStart(3, '0')}`,
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          type: 'SEDAN',
          initialCost: 22000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant2.id,
        })
      }

      await prisma.vehicle.createMany({ data: [...vehicles1, ...vehicles2] })

      // Test tenant-specific queries
      const startTime = Date.now()
      const tenant1Vehicles = await prisma.vehicle.findMany({
        where: { tenantId: tenant1.id }
      })
      const queryTime = Date.now() - startTime

      expect(queryTime).toBeLessThan(50) // Should be very fast with tenant index
      expect(tenant1Vehicles).toHaveLength(50)
      expect(tenant1Vehicles.every(v => v.tenantId === tenant1.id)).toBe(true)
    })
  })

  describe('Connection Pool Management', () => {
    it('should handle concurrent database operations', async () => {
      const tenant = await createTestTenant()
      
      // Create concurrent operations
      const operations = []
      
      for (let i = 0; i < 10; i++) {
        operations.push(
          prisma.vehicle.create({
            data: {
              registrationNumber: `CONC${i.toString().padStart(3, '0')}`,
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
        )
      }

      const startTime = Date.now()
      const results = await Promise.all(operations)
      const totalTime = Date.now() - startTime

      expect(totalTime).toBeLessThan(2000) // Should complete within 2 seconds
      expect(results).toHaveLength(10)
      expect(results.every(r => r.tenantId === tenant.id)).toBe(true)
    })

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking Prisma client to simulate connection errors
      // In a real scenario, you'd test with a connection pool that's exhausted
      
      const tenant = await createTestTenant()
      
      // Test that the application handles database errors gracefully
      try {
        await prisma.vehicle.findMany({
          where: { tenantId: 'non-existent-tenant' }
        })
      } catch (error) {
        // Should handle error gracefully
        expect(error).toBeDefined()
      }
    })
  })

  describe('Memory Usage', () => {
    it('should efficiently handle large result sets', async () => {
      const tenant = await createTestTenant()
      
      // Create large dataset
      const vehicles = []
      for (let i = 0; i < 10000; i++) {
        vehicles.push({
          registrationNumber: `MEM${i.toString().padStart(5, '0')}`,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          type: 'SEDAN',
          initialCost: 25000,
          currentMileage: 0,
          status: 'ACTIVE',
          tenantId: tenant.id,
        })
      }

      await prisma.vehicle.createMany({ data: vehicles })

      // Test memory-efficient querying with pagination
      const pageSize = 1000
      const totalPages = Math.ceil(vehicles.length / pageSize)
      let totalProcessed = 0

      for (let page = 1; page <= totalPages; page++) {
        const result = await prisma.vehicle.findMany({
          where: { tenantId: tenant.id },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
            status: true
          }
        })
        
        totalProcessed += result.length
      }

      expect(totalProcessed).toBe(10000)
    })
  })
})
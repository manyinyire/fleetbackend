import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'

// Mock all external dependencies
jest.mock('@/lib/auth-helpers', () => ({
  requireTenant: jest.fn(),
  requireRole: jest.fn(),
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/get-tenant-prisma', () => ({
  getTenantPrisma: jest.fn(),
}))

jest.mock('@/lib/tenant', () => ({
  setTenantContext: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: jest.fn(),
      signInEmail: jest.fn(),
    },
  },
}))

describe('Complete System Integration Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('End-to-End Fleet Management Workflow', () => {
    it('should complete full fleet management lifecycle', async () => {
      // 1. Tenant Registration and Setup
      const tenant = await createTestTenant({
        name: 'Complete Fleet Company',
        email: 'fleet@complete.com',
        plan: 'PREMIUM',
        status: 'ACTIVE'
      })

      const adminUser = await createTestUser({
        tenantId: tenant.id,
        email: 'admin@complete.com',
        name: 'Fleet Administrator',
        role: 'TENANT_ADMIN'
      })

      // 2. Fleet Setup
      const vehicles = await Promise.all([
        prisma.vehicle.create({
          data: {
            registrationNumber: 'FLEET001',
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            type: 'SEDAN',
            initialCost: 25000,
            currentMileage: 0,
            status: 'ACTIVE',
            tenantId: tenant.id,
          }
        }),
        prisma.vehicle.create({
          data: {
            registrationNumber: 'FLEET002',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            type: 'SEDAN',
            initialCost: 22000,
            currentMileage: 0,
            status: 'ACTIVE',
            tenantId: tenant.id,
          }
        }),
        prisma.vehicle.create({
          data: {
            registrationNumber: 'FLEET003',
            make: 'Ford',
            model: 'Transit',
            year: 2019,
            type: 'VAN',
            initialCost: 30000,
            currentMileage: 0,
            status: 'MAINTENANCE',
            tenantId: tenant.id,
          }
        })
      ])

      const drivers = await Promise.all([
        prisma.driver.create({
          data: {
            fullName: 'John Fleet Driver',
            nationalId: '123456789',
            licenseNumber: 'LIC123456',
            licenseExpiry: new Date('2025-12-31'),
            phone: '+1234567890',
            email: 'john@fleet.com',
            paymentModel: 'FIXED',
            paymentConfig: { amount: 1200 },
            debtBalance: 0,
            status: 'ACTIVE',
            tenantId: tenant.id,
          }
        }),
        prisma.driver.create({
          data: {
            fullName: 'Jane Fleet Driver',
            nationalId: '987654321',
            licenseNumber: 'LIC789012',
            licenseExpiry: new Date('2025-12-31'),
            phone: '+1234567891',
            email: 'jane@fleet.com',
            paymentModel: 'PERCENTAGE',
            paymentConfig: { percentage: 20 },
            debtBalance: 0,
            status: 'ACTIVE',
            tenantId: tenant.id,
          }
        })
      ])

      // 3. Driver-Vehicle Assignments
      const assignments = await Promise.all([
        prisma.driverVehicleAssignment.create({
          data: {
            driverId: drivers[0].id,
            vehicleId: vehicles[0].id,
            assignedAt: new Date(),
            status: 'ACTIVE',
          }
        }),
        prisma.driverVehicleAssignment.create({
          data: {
            driverId: drivers[1].id,
            vehicleId: vehicles[1].id,
            assignedAt: new Date(),
            status: 'ACTIVE',
          }
        })
      ])

      // 4. Financial Operations
      const incomes = await Promise.all([
        prisma.income.create({
          data: {
            amount: 5000,
            description: 'Trip revenue - Route A',
            date: new Date(),
            vehicleId: vehicles[0].id,
            driverId: drivers[0].id,
            tenantId: tenant.id,
          }
        }),
        prisma.income.create({
          data: {
            amount: 3500,
            description: 'Trip revenue - Route B',
            date: new Date(),
            vehicleId: vehicles[1].id,
            driverId: drivers[1].id,
            tenantId: tenant.id,
          }
        })
      ])

      const expenses = await Promise.all([
        prisma.expense.create({
          data: {
            amount: 200,
            description: 'Fuel for Route A',
            category: 'FUEL',
            date: new Date(),
            vehicleId: vehicles[0].id,
            driverId: drivers[0].id,
            status: 'APPROVED',
            tenantId: tenant.id,
          }
        }),
        prisma.expense.create({
          data: {
            amount: 150,
            description: 'Fuel for Route B',
            category: 'FUEL',
            date: new Date(),
            vehicleId: vehicles[1].id,
            driverId: drivers[1].id,
            status: 'APPROVED',
            tenantId: tenant.id,
          }
        }),
        prisma.expense.create({
          data: {
            amount: 500,
            description: 'Vehicle maintenance',
            category: 'MAINTENANCE',
            date: new Date(),
            vehicleId: vehicles[2].id,
            status: 'PENDING',
            tenantId: tenant.id,
          }
        })
      ])

      const remittances = await Promise.all([
        prisma.remittance.create({
          data: {
            amount: 1200,
            description: 'Driver payment - John',
            date: new Date(),
            vehicleId: vehicles[0].id,
            driverId: drivers[0].id,
            status: 'PENDING',
            tenantId: tenant.id,
          }
        }),
        prisma.remittance.create({
          data: {
            amount: 700, // 20% of 3500
            description: 'Driver payment - Jane',
            date: new Date(),
            vehicleId: vehicles[1].id,
            driverId: drivers[1].id,
            status: 'PENDING',
            tenantId: tenant.id,
          }
        })
      ])

      // 5. Maintenance Records
      const maintenanceRecords = await Promise.all([
        prisma.maintenanceRecord.create({
          data: {
            vehicleId: vehicles[0].id,
            date: new Date(),
            type: 'ROUTINE',
            description: 'Oil change and inspection',
            cost: 150,
            mileage: 10000,
            tenantId: tenant.id,
          }
        }),
        prisma.maintenanceRecord.create({
          data: {
            vehicleId: vehicles[2].id,
            date: new Date(),
            type: 'REPAIR',
            description: 'Engine repair',
            cost: 800,
            mileage: 50000,
            tenantId: tenant.id,
          }
        })
      ])

      // 6. Audit Trail
      const auditLogs = await Promise.all([
        prisma.auditLog.create({
          data: {
            action: 'TENANT_CREATED',
            details: 'New tenant created',
            userId: adminUser.id,
            tenantId: tenant.id,
            severity: 'INFO',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'VEHICLE_CREATED',
            details: 'New vehicle added to fleet',
            userId: adminUser.id,
            tenantId: tenant.id,
            severity: 'INFO',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'DRIVER_CREATED',
            details: 'New driver added to fleet',
            userId: adminUser.id,
            tenantId: tenant.id,
            severity: 'INFO',
          }
        })
      ])

      // 7. Verify Complete System State
      const systemState = await prisma.tenant.findUnique({
        where: { id: tenant.id },
        include: {
          users: true,
          vehicles: {
            include: {
              drivers: {
                include: {
                  driver: true
                }
              },
              maintenanceRecords: true
            }
          },
          drivers: {
            include: {
              vehicles: {
                include: {
                  vehicle: true
                }
              }
            }
          },
          settings: true
        }
      })

      // Verify tenant setup
      expect(systemState).toBeTruthy()
      expect(systemState?.name).toBe('Complete Fleet Company')
      expect(systemState?.plan).toBe('PREMIUM')
      expect(systemState?.status).toBe('ACTIVE')

      // Verify users
      expect(systemState?.users).toHaveLength(1)
      expect(systemState?.users[0].role).toBe('TENANT_ADMIN')

      // Verify vehicles
      expect(systemState?.vehicles).toHaveLength(3)
      expect(systemState?.vehicles.filter(v => v.status === 'ACTIVE')).toHaveLength(2)
      expect(systemState?.vehicles.filter(v => v.status === 'MAINTENANCE')).toHaveLength(1)

      // Verify drivers
      expect(systemState?.drivers).toHaveLength(2)
      expect(systemState?.drivers.every(d => d.status === 'ACTIVE')).toBe(true)

      // Verify assignments
      const activeAssignments = systemState?.vehicles.flatMap(v => v.drivers).filter(a => a.status === 'ACTIVE')
      expect(activeAssignments).toHaveLength(2)

      // 8. Financial Summary Verification
      const financialSummary = await Promise.all([
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
        prisma.remittance.aggregate({
          where: { tenantId: tenant.id },
          _sum: { amount: true },
          _count: { id: true }
        })
      ])

      const [totalIncome, totalExpenses, totalRemittances] = financialSummary

      expect(totalIncome._sum.amount).toBe(8500) // 5000 + 3500
      expect(totalExpenses._sum.amount).toBe(350) // 200 + 150
      expect(totalRemittances._sum.amount).toBe(1900) // 1200 + 700

      const netProfit = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0)
      expect(netProfit).toBe(8150)

      // 9. Maintenance Summary
      const maintenanceSummary = await prisma.maintenanceRecord.aggregate({
        where: { tenantId: tenant.id },
        _sum: { cost: true },
        _count: { id: true }
      })

      expect(maintenanceSummary._count.id).toBe(2)
      expect(maintenanceSummary._sum.cost).toBe(950) // 150 + 800

      // 10. Audit Trail Verification
      const auditSummary = await prisma.auditLog.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' }
      })

      expect(auditSummary).toHaveLength(3)
      expect(auditSummary.every(log => log.tenantId === tenant.id)).toBe(true)
      expect(auditSummary.every(log => log.userId === adminUser.id)).toBe(true)
    })
  })

  describe('Super Admin Platform Management', () => {
    it('should handle complete platform management workflow', async () => {
      // 1. Create multiple tenants
      const tenants = await Promise.all([
        createTestTenant({ name: 'Premium Company', plan: 'PREMIUM' }),
        createTestTenant({ name: 'Basic Company', plan: 'BASIC' }),
        createTestTenant({ name: 'Free Company', plan: 'FREE' }),
        createTestTenant({ name: 'Suspended Company', plan: 'BASIC', status: 'SUSPENDED' })
      ])

      // 2. Create users for each tenant
      const users = await Promise.all([
        createTestUser({ tenantId: tenants[0].id, role: 'TENANT_ADMIN' }),
        createTestUser({ tenantId: tenants[0].id, role: 'FLEET_MANAGER' }),
        createTestUser({ tenantId: tenants[1].id, role: 'TENANT_ADMIN' }),
        createTestUser({ tenantId: tenants[2].id, role: 'TENANT_ADMIN' }),
        createTestUser({ tenantId: tenants[3].id, role: 'TENANT_ADMIN' })
      ])

      // 3. Create Super Admin user
      const superAdmin = await createTestUser({
        email: 'admin@azaire.com',
        name: 'Super Administrator',
        role: 'SUPER_ADMIN'
      })

      // 4. Create platform-wide audit logs
      const platformAuditLogs = await Promise.all([
        prisma.auditLog.create({
          data: {
            action: 'TENANT_CREATED',
            details: 'New tenant created',
            userId: superAdmin.id,
            tenantId: tenants[0].id,
            severity: 'INFO',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'TENANT_SUSPENDED',
            details: 'Tenant suspended for policy violation',
            userId: superAdmin.id,
            tenantId: tenants[3].id,
            severity: 'CRITICAL',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'SUPER_ADMIN_LOGIN',
            details: 'Super admin logged in',
            userId: superAdmin.id,
            severity: 'INFO',
          }
        })
      ])

      // 5. Verify platform statistics
      const platformStats = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        prisma.tenant.count({ where: { plan: 'PREMIUM' } }),
        prisma.tenant.count({ where: { plan: 'BASIC' } }),
        prisma.tenant.count({ where: { plan: 'FREE' } }),
        prisma.auditLog.count({ where: { severity: 'CRITICAL' } })
      ])

      const [totalTenants, totalUsers, activeTenants, premiumTenants, basicTenants, freeTenants, criticalLogs] = platformStats

      expect(totalTenants).toBe(4)
      expect(totalUsers).toBe(6) // 5 tenant users + 1 super admin
      expect(activeTenants).toBe(3)
      expect(premiumTenants).toBe(1)
      expect(basicTenants).toBe(2)
      expect(freeTenants).toBe(1)
      expect(criticalLogs).toBe(1)

      // 6. Verify tenant management capabilities
      const tenantDetails = await Promise.all(
        tenants.map(tenant => 
          prisma.tenant.findUnique({
            where: { id: tenant.id },
            include: {
              users: true,
              _count: {
                select: {
                  users: true,
                  vehicles: true,
                  drivers: true
                }
              }
            }
          })
        )
      )

      expect(tenantDetails).toHaveLength(4)
      expect(tenantDetails.every(tenant => tenant !== null)).toBe(true)

      // 7. Verify audit trail completeness
      const allAuditLogs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' }
      })

      expect(allAuditLogs).toHaveLength(3)
      expect(allAuditLogs.every(log => log.userId === superAdmin.id)).toBe(true)

      // 8. Test tenant status management
      const suspendedTenant = await prisma.tenant.findUnique({
        where: { id: tenants[3].id }
      })

      expect(suspendedTenant?.status).toBe('SUSPENDED')

      // 9. Test user role distribution
      const roleDistribution = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      })

      const roleCounts = roleDistribution.reduce((acc, role) => {
        acc[role.role] = role._count.id
        return acc
      }, {} as Record<string, number>)

      expect(roleCounts.SUPER_ADMIN).toBe(1)
      expect(roleCounts.TENANT_ADMIN).toBe(4)
      expect(roleCounts.FLEET_MANAGER).toBe(1)
    })
  })

  describe('System Health and Monitoring', () => {
    it('should maintain system health metrics', async () => {
      // 1. Create test data for health monitoring
      const tenant = await createTestTenant()
      const user = await createTestUser({ tenantId: tenant.id })

      // 2. Create various audit logs for monitoring
      const healthAuditLogs = await Promise.all([
        prisma.auditLog.create({
          data: {
            action: 'LOGIN_SUCCESS',
            details: 'User logged in successfully',
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
        }),
        prisma.auditLog.create({
          data: {
            action: 'API_ERROR',
            details: 'Database connection timeout',
            severity: 'ERROR',
          }
        }),
        prisma.auditLog.create({
          data: {
            action: 'SYSTEM_MAINTENANCE',
            details: 'Scheduled maintenance completed',
            severity: 'INFO',
          }
        })
      ])

      // 3. Verify system health metrics
      const healthMetrics = await Promise.all([
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }),
        prisma.auditLog.count({
          where: {
            severity: 'ERROR',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.auditLog.count({
          where: {
            severity: 'WARNING',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.auditLog.count({
          where: {
            action: 'LOGIN_SUCCESS',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ])

      const [totalLogs, errorLogs, warningLogs, successfulLogins] = healthMetrics

      expect(totalLogs).toBe(4)
      expect(errorLogs).toBe(1)
      expect(warningLogs).toBe(1)
      expect(successfulLogins).toBe(1)

      // 4. Verify system performance indicators
      const performanceIndicators = {
        errorRate: (errorLogs / totalLogs) * 100,
        warningRate: (warningLogs / totalLogs) * 100,
        successRate: (successfulLogins / totalLogs) * 100
      }

      expect(performanceIndicators.errorRate).toBe(25)
      expect(performanceIndicators.warningRate).toBe(25)
      expect(performanceIndicators.successRate).toBe(25)

      // 5. Test system alert generation
      const criticalAlerts = await prisma.auditLog.findMany({
        where: {
          severity: 'ERROR',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      expect(criticalAlerts).toHaveLength(1)
      expect(criticalAlerts[0].action).toBe('API_ERROR')
    })
  })
})
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma, cleanupDatabase, createTestTenant, createTestUser, createTestVehicle, createTestDriver } from '../setup/test-db'

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireTenant: jest.fn(),
}))

// Mock tenant utilities
jest.mock('@/lib/get-tenant-prisma', () => ({
  getTenantPrisma: jest.fn(),
}))

jest.mock('@/lib/tenant', () => ({
  setTenantContext: jest.fn(),
}))

describe('Fleet Management API', () => {
  let testTenant: any
  let testUser: any
  let mockPrisma: any

  beforeEach(async () => {
    await cleanupDatabase()
    testTenant = await createTestTenant()
    testUser = await createTestUser({ tenantId: testTenant.id })
    
    // Mock Prisma client
    mockPrisma = {
      driver: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      vehicle: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    }

    const { requireTenant } = require('@/lib/auth-helpers')
    const { getTenantPrisma } = require('@/lib/get-tenant-prisma')
    const { setTenantContext } = require('@/lib/tenant')

    requireTenant.mockResolvedValue({
      user: testUser,
      tenantId: testTenant.id
    })
    getTenantPrisma.mockReturnValue(mockPrisma)
    setTenantContext.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('Drivers API', () => {
    describe('GET /api/drivers', () => {
      it('should fetch drivers successfully', async () => {
        const mockDrivers = [
          {
            id: 'driver-1',
            fullName: 'John Doe',
            nationalId: '123456789',
            licenseNumber: 'LIC123456',
            status: 'ACTIVE',
            vehicles: [],
            remittances: [],
          }
        ]

        mockPrisma.driver.findMany.mockResolvedValue(mockDrivers)

        const request = new NextRequest('http://localhost:3000/api/drivers')
        const { GET } = await import('@/app/api/drivers/route')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockDrivers)
        expect(mockPrisma.driver.findMany).toHaveBeenCalledWith({
          include: {
            vehicles: {
              include: {
                vehicle: true
              }
            },
            remittances: {
              orderBy: { date: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      })

      it('should handle database errors', async () => {
        mockPrisma.driver.findMany.mockRejectedValue(new Error('Database error'))

        const request = new NextRequest('http://localhost:3000/api/drivers')
        const { GET } = await import('@/app/api/drivers/route')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to fetch drivers')
      })
    })

    describe('POST /api/drivers', () => {
      it('should create driver successfully', async () => {
        const driverData = {
          fullName: 'Jane Smith',
          nationalId: '987654321',
          licenseNumber: 'LIC789012',
          licenseExpiry: '2025-12-31',
          phone: '+1234567890',
          email: 'jane@example.com',
          paymentModel: 'FIXED',
          paymentConfig: { amount: 1000 }
        }

        const mockDriver = {
          id: 'driver-2',
          ...driverData,
          debtBalance: 0,
          status: 'ACTIVE'
        }

        mockPrisma.driver.create.mockResolvedValue(mockDriver)

        const request = new NextRequest('http://localhost:3000/api/drivers', {
          method: 'POST',
          body: JSON.stringify(driverData),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const { POST } = await import('@/app/api/drivers/route')
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockDriver)
        expect(mockPrisma.driver.create).toHaveBeenCalledWith({
          data: {
            ...driverData,
            licenseExpiry: new Date(driverData.licenseExpiry),
            debtBalance: 0,
            status: 'ACTIVE',
          }
        })
      })

      it('should handle validation errors', async () => {
        const invalidData = {
          fullName: '', // Invalid: empty name
          nationalId: '123',
          licenseNumber: 'LIC123456',
        }

        const request = new NextRequest('http://localhost:3000/api/drivers', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const { POST } = await import('@/app/api/drivers/route')
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to create driver')
      })
    })
  })

  describe('Vehicles API', () => {
    describe('GET /api/vehicles', () => {
      it('should fetch vehicles successfully', async () => {
        const mockVehicles = [
          {
            id: 'vehicle-1',
            registrationNumber: 'ABC123',
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            type: 'SEDAN',
            status: 'ACTIVE',
            drivers: [],
            maintenanceRecords: [],
          }
        ]

        mockPrisma.vehicle.findMany.mockResolvedValue(mockVehicles)

        const request = new NextRequest('http://localhost:3000/api/vehicles')
        const { GET } = await import('@/app/api/vehicles/route')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockVehicles)
        expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
          include: {
            drivers: {
              include: {
                driver: true
              }
            },
            maintenanceRecords: {
              orderBy: { date: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      })
    })

    describe('POST /api/vehicles', () => {
      it('should create vehicle successfully', async () => {
        const vehicleData = {
          registrationNumber: 'XYZ789',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          type: 'SEDAN',
          initialCost: 25000
        }

        const mockVehicle = {
          id: 'vehicle-2',
          ...vehicleData,
          currentMileage: 0,
          status: 'ACTIVE'
        }

        mockPrisma.vehicle.create.mockResolvedValue(mockVehicle)

        const request = new NextRequest('http://localhost:3000/api/vehicles', {
          method: 'POST',
          body: JSON.stringify(vehicleData),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const { POST } = await import('@/app/api/vehicles/route')
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockVehicle)
        expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
          data: {
            ...vehicleData,
            currentMileage: 0,
            status: 'ACTIVE',
          }
        })
      })
    })
  })
})
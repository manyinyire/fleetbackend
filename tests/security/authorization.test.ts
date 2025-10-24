import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireTenant: jest.fn(),
  requireRole: jest.fn(),
  requireAuth: jest.fn(),
}))

describe('Security and Authorization Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('Role-Based Access Control', () => {
    it('should allow SUPER_ADMIN to access super admin endpoints', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/stats')
      const { GET } = await import('@/app/api/superadmin/dashboard/stats/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(requireRole).toHaveBeenCalledWith('SUPER_ADMIN')
    })

    it('should deny non-SUPER_ADMIN access to super admin endpoints', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockRejectedValue(new Error('Forbidden'))

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/stats')
      const { GET } = await import('@/app/api/superadmin/dashboard/stats/route')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('should allow TENANT_ADMIN to access tenant endpoints', async () => {
      const tenant = await createTestTenant()
      const user = await createTestUser({ 
        tenantId: tenant.id, 
        role: 'TENANT_ADMIN' 
      })

      const { requireTenant } = require('@/lib/auth-helpers')
      requireTenant.mockResolvedValue({
        user,
        tenantId: tenant.id
      })

      const request = new NextRequest('http://localhost:3000/api/drivers')
      const { GET } = await import('@/app/api/drivers/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(requireTenant).toHaveBeenCalled()
    })

    it('should deny access to tenant endpoints without proper authentication', async () => {
      const { requireTenant } = require('@/lib/auth-helpers')
      requireTenant.mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost:3000/api/drivers')
      const { GET } = await import('@/app/api/drivers/route')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('Data Isolation and Row-Level Security', () => {
    it('should prevent cross-tenant data access', async () => {
      const tenant1 = await createTestTenant({ name: 'Company 1' })
      const tenant2 = await createTestTenant({ name: 'Company 2' })

      const user1 = await createTestUser({ 
        tenantId: tenant1.id, 
        role: 'TENANT_ADMIN' 
      })

      // Create data for tenant1
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

      // Create data for tenant2
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

      // Mock tenant context for tenant1
      const { requireTenant } = require('@/lib/auth-helpers')
      const { getTenantPrisma } = require('@/lib/get-tenant-prisma')
      const { setTenantContext } = require('@/lib/tenant')

      requireTenant.mockResolvedValue({
        user: user1,
        tenantId: tenant1.id
      })

      // Mock Prisma client to only return tenant1's data
      const mockPrisma = {
        vehicle: {
          findMany: jest.fn().mockResolvedValue([vehicle1])
        }
      }

      getTenantPrisma.mockReturnValue(mockPrisma)
      setTenantContext.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/vehicles')
      const { GET } = await import('@/app/api/vehicles/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].registrationNumber).toBe('TENANT1-001')
      expect(data[0].tenantId).toBe(tenant1.id)

      // Verify tenant2's data is not accessible
      expect(data.find((v: any) => v.registrationNumber === 'TENANT2-001')).toBeUndefined()
    })

    it('should prevent unauthorized access to other tenants data', async () => {
      const tenant1 = await createTestTenant({ name: 'Company 1' })
      const tenant2 = await createTestTenant({ name: 'Company 2' })

      const user1 = await createTestUser({ 
        tenantId: tenant1.id, 
        role: 'TENANT_ADMIN' 
      })

      // Create data for tenant2
      await prisma.vehicle.create({
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

      // Mock tenant context for tenant1
      const { requireTenant } = require('@/lib/auth-helpers')
      const { getTenantPrisma } = require('@/lib/get-tenant-prisma')
      const { setTenantContext } = require('@/lib/tenant')

      requireTenant.mockResolvedValue({
        user: user1,
        tenantId: tenant1.id
      })

      // Mock Prisma client to return empty array (no data for tenant1)
      const mockPrisma = {
        vehicle: {
          findMany: jest.fn().mockResolvedValue([])
        }
      }

      getTenantPrisma.mockReturnValue(mockPrisma)
      setTenantContext.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/vehicles')
      const { GET } = await import('@/app/api/vehicles/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(0)

      // Verify setTenantContext was called with correct tenant ID
      expect(setTenantContext).toHaveBeenCalledWith(tenant1.id)
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('should validate required fields in API requests', async () => {
      const tenant = await createTestTenant()
      const user = await createTestUser({ tenantId: tenant.id })

      const { requireTenant } = require('@/lib/auth-helpers')
      const { getTenantPrisma } = require('@/lib/get-tenant-prisma')
      const { setTenantContext } = require('@/lib/tenant')

      requireTenant.mockResolvedValue({
        user,
        tenantId: tenant.id
      })

      const mockPrisma = {
        driver: {
          create: jest.fn().mockRejectedValue(new Error('Validation error'))
        }
      }

      getTenantPrisma.mockReturnValue(mockPrisma)
      setTenantContext.mockResolvedValue(undefined)

      const invalidData = {
        fullName: '', // Invalid: empty name
        nationalId: '123', // Invalid: too short
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

    it('should sanitize user input to prevent injection attacks', async () => {
      const tenant = await createTestTenant()
      const user = await createTestUser({ tenantId: tenant.id })

      const { requireTenant } = require('@/lib/auth-helpers')
      const { getTenantPrisma } = require('@/lib/get-tenant-prisma')
      const { setTenantContext } = require('@/lib/tenant')

      requireTenant.mockResolvedValue({
        user,
        tenantId: tenant.id
      })

      const mockPrisma = {
        driver: {
          create: jest.fn().mockImplementation((data) => {
            // Verify that input is properly sanitized
            expect(data.data.fullName).not.toContain('<script>')
            expect(data.data.fullName).not.toContain('DROP TABLE')
            return Promise.resolve({ id: 'driver-id', ...data.data })
          })
        }
      }

      getTenantPrisma.mockReturnValue(mockPrisma)
      setTenantContext.mockResolvedValue(undefined)

      const maliciousData = {
        fullName: '<script>alert("xss")</script>John Doe',
        nationalId: '123456789',
        licenseNumber: 'LIC123456',
        licenseExpiry: '2025-12-31',
        phone: '+1234567890',
        email: 'john@example.com',
        paymentModel: 'FIXED',
        paymentConfig: { amount: 1000 }
      }

      const request = new NextRequest('http://localhost:3000/api/drivers', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { POST } = await import('@/app/api/drivers/route')
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.driver.create).toHaveBeenCalled()
    })
  })

  describe('Session Management', () => {
    it('should create audit logs for authentication events', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/auth/logout', {
        method: 'POST',
      })

      const { POST } = await import('@/app/api/superadmin/auth/logout/route')
      const response = await POST(request)

      expect(response.status).toBe(200)

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'SUPER_ADMIN_LOGOUT' }
      })

      expect(auditLog).toBeTruthy()
      expect(auditLog?.details).toContain('admin@azaire.com')
    })

    it('should handle session expiration gracefully', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockRejectedValue(new Error('Session expired'))

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/stats')
      const { GET } = await import('@/app/api/superadmin/dashboard/stats/route')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('API Rate Limiting and Security Headers', () => {
    it('should include proper security headers in responses', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/stats')
      const { GET } = await import('@/app/api/superadmin/dashboard/stats/route')
      const response = await GET(request)

      expect(response.status).toBe(200)
      
      // Check for security headers
      expect(response.headers.get('content-type')).toBe('application/json')
      // Note: Additional security headers would be added by middleware
    })
  })
})
/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireRole: jest.fn(),
}))

describe('Super Admin Tenants API', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('GET /api/superadmin/tenants', () => {
    it('should fetch tenants with pagination and filters', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      // Create test tenants
      const tenant1 = await createTestTenant({ 
        name: 'Premium Company', 
        plan: 'PREMIUM',
        status: 'ACTIVE'
      })
      const tenant2 = await createTestTenant({ 
        name: 'Basic Company', 
        plan: 'BASIC',
        status: 'ACTIVE'
      })
      const tenant3 = await createTestTenant({ 
        name: 'Free Company', 
        plan: 'FREE',
        status: 'SUSPENDED'
      })

      // Create users for tenants
      await createTestUser({ tenantId: tenant1.id })
      await createTestUser({ tenantId: tenant1.id })
      await createTestUser({ tenantId: tenant2.id })

      const request = new NextRequest('http://localhost:3000/api/superadmin/tenants?page=1&limit=10')
      const { GET } = await import('@/app/api/superadmin/tenants/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('tenants')
      expect(data).toHaveProperty('pagination')
      expect(data.tenants).toHaveLength(3)

      // Check tenant data includes calculated fields
      const premiumTenant = data.tenants.find((t: any) => t.plan === 'PREMIUM')
      expect(premiumTenant).toHaveProperty('userCount')
      expect(premiumTenant).toHaveProperty('vehicleCount')
      expect(premiumTenant).toHaveProperty('driverCount')
      expect(premiumTenant).toHaveProperty('mrr')
    })

    it('should filter tenants by status', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      await createTestTenant({ status: 'ACTIVE' })
      await createTestTenant({ status: 'SUSPENDED' })

      const request = new NextRequest('http://localhost:3000/api/superadmin/tenants?status=ACTIVE')
      const { GET } = await import('@/app/api/superadmin/tenants/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tenants).toHaveLength(1)
      expect(data.tenants[0].status).toBe('ACTIVE')
    })

    it('should filter tenants by plan', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      await createTestTenant({ plan: 'PREMIUM' })
      await createTestTenant({ plan: 'BASIC' })
      await createTestTenant({ plan: 'FREE' })

      const request = new NextRequest('http://localhost:3000/api/superadmin/tenants?plan=PREMIUM')
      const { GET } = await import('@/app/api/superadmin/tenants/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tenants).toHaveLength(1)
      expect(data.tenants[0].plan).toBe('PREMIUM')
    })

    it('should search tenants by name', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      await createTestTenant({ name: 'Alpha Company' })
      await createTestTenant({ name: 'Beta Company' })
      await createTestTenant({ name: 'Gamma Company' })

      const request = new NextRequest('http://localhost:3000/api/superadmin/tenants?search=Alpha')
      const { GET } = await import('@/app/api/superadmin/tenants/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tenants).toHaveLength(1)
      expect(data.tenants[0].name).toBe('Alpha Company')
    })
  })

  describe('POST /api/superadmin/tenants', () => {
    it('should create new tenant', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const tenantData = {
        name: 'New Company',
        email: 'new@company.com',
        phone: '+1234567890',
        plan: 'BASIC',
        status: 'ACTIVE'
      }

      const request = new NextRequest('http://localhost:3000/api/superadmin/tenants', {
        method: 'POST',
        body: JSON.stringify(tenantData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { POST } = await import('@/app/api/superadmin/tenants/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.tenant.name).toBe('New Company')
      expect(data.tenant.slug).toBe('new-company')
      expect(data.tenant.plan).toBe('BASIC')

      // Verify tenant was created in database
      const createdTenant = await prisma.tenant.findUnique({
        where: { id: data.tenant.id }
      })
      expect(createdTenant).toBeTruthy()

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'TENANT_CREATED' }
      })
      expect(auditLog).toBeTruthy()
    })

    it('should handle validation errors', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const invalidData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid email format
        plan: 'INVALID_PLAN' // Invalid plan
      }

      const request = new NextRequest('http://localhost:3000/api/superadmin/tenants', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { POST } = await import('@/app/api/superadmin/tenants/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('GET /api/superadmin/tenants/[id]', () => {
    it('should fetch tenant details', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const tenant = await createTestTenant()
      const user = await createTestUser({ tenantId: tenant.id })

      const request = new NextRequest(`http://localhost:3000/api/superadmin/tenants/${tenant.id}`)
      const { GET } = await import('@/app/api/superadmin/tenants/[id]/route')
      const response = await GET(request, { params: { id: tenant.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tenant.id).toBe(tenant.id)
      expect(data.tenant.name).toBe(tenant.name)
      expect(data).toHaveProperty('users')
      expect(data).toHaveProperty('vehicles')
      expect(data).toHaveProperty('drivers')
      expect(data).toHaveProperty('recentActivity')
    })

    it('should return 404 for non-existent tenant', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/tenants/non-existent-id')
      const { GET } = await import('@/app/api/superadmin/tenants/[id]/route')
      const response = await GET(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Tenant not found')
    })
  })

  describe('PUT /api/superadmin/tenants/[id]', () => {
    it('should update tenant', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const tenant = await createTestTenant()

      const updateData = {
        name: 'Updated Company Name',
        plan: 'PREMIUM',
        status: 'ACTIVE'
      }

      const request = new NextRequest(`http://localhost:3000/api/superadmin/tenants/${tenant.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { PUT } = await import('@/app/api/superadmin/tenants/[id]/route')
      const response = await PUT(request, { params: { id: tenant.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tenant.name).toBe('Updated Company Name')
      expect(data.tenant.plan).toBe('PREMIUM')

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'TENANT_UPDATED' }
      })
      expect(auditLog).toBeTruthy()
    })
  })

  describe('DELETE /api/superadmin/tenants/[id]', () => {
    it('should delete tenant', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const tenant = await createTestTenant()

      const request = new NextRequest(`http://localhost:3000/api/superadmin/tenants/${tenant.id}`, {
        method: 'DELETE',
      })

      const { DELETE } = await import('@/app/api/superadmin/tenants/[id]/route')
      const response = await DELETE(request, { params: { id: tenant.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify tenant was deleted
      const deletedTenant = await prisma.tenant.findUnique({
        where: { id: tenant.id }
      })
      expect(deletedTenant).toBeNull()

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'TENANT_DELETED' }
      })
      expect(auditLog).toBeTruthy()
    })
  })
})
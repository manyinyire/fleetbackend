import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireRole: jest.fn(),
}))

describe('Super Admin Dashboard API', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('GET /api/superadmin/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      // Create test data
      const tenant1 = await createTestTenant({ name: 'Company 1', plan: 'PREMIUM' })
      const tenant2 = await createTestTenant({ name: 'Company 2', plan: 'BASIC' })
      const tenant3 = await createTestTenant({ name: 'Company 3', plan: 'FREE' })

      await createTestUser({ tenantId: tenant1.id, role: 'TENANT_ADMIN' })
      await createTestUser({ tenantId: tenant1.id, role: 'FLEET_MANAGER' })
      await createTestUser({ tenantId: tenant2.id, role: 'TENANT_ADMIN' })
      await createTestUser({ tenantId: tenant3.id, role: 'TENANT_ADMIN' })

      // Create audit logs for activity
      await prisma.auditLog.createMany([
        {
          action: 'USER_LOGIN',
          details: 'User login',
          userId: 'user-1',
          tenantId: tenant1.id,
          severity: 'INFO',
        },
        {
          action: 'TENANT_CREATED',
          details: 'New tenant created',
          tenantId: tenant1.id,
          severity: 'INFO',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/stats')
      const { GET } = await import('@/app/api/superadmin/dashboard/stats/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('totalTenants')
      expect(data).toHaveProperty('activeUsers')
      expect(data).toHaveProperty('mrr')
      expect(data).toHaveProperty('churnRate')
      expect(data).toHaveProperty('changes')

      expect(data.totalTenants).toBe(3)
      expect(data.activeUsers).toBe(4)
      expect(data.mrr).toBeGreaterThan(0) // Should calculate based on plans
    })

    it('should handle empty database', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/stats')
      const { GET } = await import('@/app/api/superadmin/dashboard/stats/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalTenants).toBe(0)
      expect(data.activeUsers).toBe(0)
      expect(data.mrr).toBe(0)
      expect(data.churnRate).toBe(0)
    })
  })

  describe('GET /api/superadmin/dashboard/charts', () => {
    it('should return chart data', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      // Create test tenants with different plans
      await createTestTenant({ plan: 'PREMIUM' })
      await createTestTenant({ plan: 'BASIC' })
      await createTestTenant({ plan: 'FREE' })

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/charts?period=12')
      const { GET } = await import('@/app/api/superadmin/dashboard/charts/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('revenueTrends')
      expect(data).toHaveProperty('tenantGrowth')
      expect(data).toHaveProperty('planDistribution')
      expect(data).toHaveProperty('statusDistribution')

      expect(Array.isArray(data.revenueTrends)).toBe(true)
      expect(Array.isArray(data.tenantGrowth)).toBe(true)
      expect(data.planDistribution).toHaveProperty('PREMIUM')
      expect(data.planDistribution).toHaveProperty('BASIC')
      expect(data.planDistribution).toHaveProperty('FREE')
    })
  })

  describe('GET /api/superadmin/dashboard/alerts', () => {
    it('should return system alerts', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      // Create test audit logs for alerts
      await prisma.auditLog.createMany([
        {
          action: 'LOGIN_FAILED',
          details: 'Failed login attempt',
          severity: 'WARNING',
        },
        {
          action: 'TENANT_SUSPENDED',
          details: 'Tenant suspended',
          severity: 'CRITICAL',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/alerts')
      const { GET } = await import('@/app/api/superadmin/dashboard/alerts/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      // Check for system health alerts
      const systemAlerts = data.filter((alert: any) => alert.type === 'system_health')
      expect(systemAlerts.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/superadmin/dashboard/activity', () => {
    it('should return recent activity', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN'
      })

      const tenant = await createTestTenant()
      await createTestUser({ tenantId: tenant.id })

      // Create test audit logs
      await prisma.auditLog.createMany([
        {
          action: 'TENANT_CREATED',
          details: 'New tenant created',
          tenantId: tenant.id,
          severity: 'INFO',
        },
        {
          action: 'USER_CREATED',
          details: 'New user created',
          tenantId: tenant.id,
          severity: 'INFO',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/superadmin/dashboard/activity')
      const { GET } = await import('@/app/api/superadmin/dashboard/activity/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('signups')
      expect(data).toHaveProperty('paymentFailures')
      expect(data).toHaveProperty('supportTickets')
      expect(data).toHaveProperty('activityFeed')

      expect(Array.isArray(data.signups)).toBe(true)
      expect(Array.isArray(data.activityFeed)).toBe(true)
    })
  })
})
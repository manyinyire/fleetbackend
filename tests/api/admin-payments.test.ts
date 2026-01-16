/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/admin/payments/route'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'

// Mock auth server
jest.mock('@/lib/auth-server', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  apiLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Admin Payments API', () => {
  let superAdminUser: any
  let tenant: any
  let invoice: any
  let payment: any
  const mockAuth = require('@/lib/auth-server').auth

  beforeEach(async () => {
    await cleanupDatabase()

    // Create super admin user
    superAdminUser = await createTestUser({
      email: 'superadmin@example.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      tenantId: null,
    })

    // Create test tenant
    tenant = await createTestTenant({
      name: 'Test Company',
      email: 'company@example.com',
    })

    // Create test invoice
    invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        invoiceNumber: 'INV-001',
        type: 'SUBSCRIPTION',
        plan: 'BASIC',
        amount: 100,
        status: 'PENDING',
        dueDate: new Date(),
      },
    })

    // Create test payment
    payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        invoiceId: invoice.id,
        amount: 100,
        currency: 'USD',
        status: 'PAID',
        verified: true,
        reconciled: false,
        paymentMethod: 'PAYNOW',
        paymentMetadata: {},
      },
    })
  })

  afterEach(async () => {
    await cleanupDatabase()
    jest.clearAllMocks()
  })

  describe('GET /api/admin/payments', () => {
    it('should return payments list for super admin', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          email: superAdminUser.email,
          name: superAdminUser.name,
          role: 'SUPER_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments?page=1&limit=50')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments).toBeDefined()
      expect(data.payments.length).toBeGreaterThan(0)
      expect(data.payments[0].id).toBe(payment.id)
      expect(data.pagination).toBeDefined()
      expect(data.stats).toBeDefined()
      expect(data.stats.totalRevenue).toBe(100)
    })

    it('should filter payments by status', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          role: 'SUPER_ADMIN',
        },
      })

      // Create another payment with different status
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          amount: 50,
          currency: 'USD',
          status: 'PENDING',
          verified: false,
          paymentMethod: 'PAYNOW',
          paymentMetadata: {},
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments?status=PAID')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.length).toBe(1)
      expect(data.payments[0].status).toBe('PAID')
    })

    it('should filter payments by tenant', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          role: 'SUPER_ADMIN',
        },
      })

      const request = new NextRequest(`http://localhost:3000/api/admin/payments?tenantId=${tenant.id}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payments.length).toBeGreaterThan(0)
      expect(data.payments[0].tenantId).toBe(tenant.id)
    })

    it('should reject non-super-admin users', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: 'regular-user',
          role: 'TENANT_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments')
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    it('should reject unauthenticated requests', async () => {
      mockAuth.api.getSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/payments')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should count unreconciled payments correctly', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          role: 'SUPER_ADMIN',
        },
      })

      // Create additional unreconciled payment
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          amount: 75,
          currency: 'USD',
          status: 'PAID',
          verified: true,
          reconciled: false,
          paymentMethod: 'PAYNOW',
          paymentMetadata: {},
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stats.unreconciledCount).toBe(2)
    })
  })

  describe('PATCH /api/admin/payments', () => {
    it('should reconcile payment successfully', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          email: superAdminUser.email,
          name: superAdminUser.name,
          role: 'SUPER_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: payment.id,
          reconciled: true,
          reconNotes: 'Payment verified and reconciled',
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.payment.reconciled).toBe(true)
      expect(data.payment.reconciledBy).toBe(superAdminUser.id)
      expect(data.payment.reconciledAt).toBeDefined()
      expect(data.payment.reconciliationNotes).toBe('Payment verified and reconciled')
    })

    it('should unreconcile payment', async () => {
      // First reconcile the payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
          reconciledBy: superAdminUser.id,
        },
      })

      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          role: 'SUPER_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: payment.id,
          reconciled: false,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.payment.reconciled).toBe(false)
    })

    it('should reject reconciliation without payment ID', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          role: 'SUPER_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          reconciled: true,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Payment ID is required')
    })

    it('should reject reconciliation for non-existent payment', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          role: 'SUPER_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: 'non-existent-id',
          reconciled: true,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Payment not found')
    })

    it('should reject non-super-admin users from reconciling', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: 'regular-user',
          role: 'TENANT_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: payment.id,
          reconciled: true,
        }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    it('should include tenant and invoice information in response', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        user: {
          id: superAdminUser.id,
          role: 'SUPER_ADMIN',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: payment.id,
          reconciled: true,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.payment.tenant).toBeDefined()
      expect(data.payment.tenant.name).toBe(tenant.name)
      expect(data.payment.invoice).toBeDefined()
      expect(data.payment.invoice.invoiceNumber).toBe(invoice.invoiceNumber)
    })
  })
})

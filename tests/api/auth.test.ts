import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db'
import { signUp } from '@/server/actions/auth'

// Mock BetterAuth
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: jest.fn(),
    },
  },
}))

describe('Authentication API', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('User Signup', () => {
    it('should create tenant and user successfully', async () => {
      const mockAuth = require('@/lib/auth').auth
      mockAuth.api.signUpEmail.mockResolvedValue({
        error: null,
        data: { id: 'user-id', email: 'test@example.com' }
      })

      const formData = new FormData()
      formData.append('name', 'John Doe')
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('companyName', 'Test Company')
      formData.append('phone', '+1234567890')

      await expect(signUp(formData)).resolves.not.toThrow()

      // Verify tenant was created
      const tenant = await prisma.tenant.findFirst({
        where: { email: 'test@example.com' }
      })
      expect(tenant).toBeTruthy()
      expect(tenant?.name).toBe('Test Company')
      expect(tenant?.slug).toBe('test-company')
      expect(tenant?.plan).toBe('FREE')
      expect(tenant?.status).toBe('ACTIVE')

      // Verify tenant settings were created
      const settings = await prisma.tenantSettings.findFirst({
        where: { tenantId: tenant?.id }
      })
      expect(settings).toBeTruthy()
      expect(settings?.companyName).toBe('Test Company')

      // Verify BetterAuth was called
      expect(mockAuth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
          data: {
            tenantId: tenant?.id,
            role: 'TENANT_ADMIN',
          },
        },
      })
    })

    it('should handle signup errors gracefully', async () => {
      const mockAuth = require('@/lib/auth').auth
      mockAuth.api.signUpEmail.mockResolvedValue({
        error: { message: 'Email already exists' }
      })

      const formData = new FormData()
      formData.append('name', 'John Doe')
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('companyName', 'Test Company')
      formData.append('phone', '+1234567890')

      await expect(signUp(formData)).rejects.toThrow('Email already exists')
    })

    it('should create unique tenant slug', async () => {
      const mockAuth = require('@/lib/auth').auth
      mockAuth.api.signUpEmail.mockResolvedValue({
        error: null,
        data: { id: 'user-id', email: 'test@example.com' }
      })

      // Create first tenant
      const formData1 = new FormData()
      formData1.append('name', 'Test Company')
      formData1.append('email', 'test1@example.com')
      formData1.append('password', 'password123')
      formData1.append('companyName', 'Test Company')
      formData1.append('phone', '+1234567890')

      await signUp(formData1)

      // Create second tenant with same company name
      const formData2 = new FormData()
      formData2.append('name', 'John Doe')
      formData2.append('email', 'test2@example.com')
      formData2.append('password', 'password123')
      formData2.append('companyName', 'Test Company')
      formData2.append('phone', '+1234567891')

      await signUp(formData2)

      const tenants = await prisma.tenant.findMany({
        where: { name: 'Test Company' }
      })

      expect(tenants).toHaveLength(2)
      expect(tenants[0].slug).toBe('test-company')
      expect(tenants[1].slug).toBe('test-company')
    })
  })
})
/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma, cleanupDatabase, createTestUser } from '../setup/test-db'

// Mock BetterAuth
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signInEmail: jest.fn(),
    },
  },
}))

// Mock the auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireRole: jest.fn(),
  requireAuth: jest.fn(),
}))

describe('Super Admin Authentication API', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('POST /api/superadmin/auth/login', () => {
    it('should login super admin successfully', async () => {
      const mockAuth = require('@/lib/auth').auth
      mockAuth.api.signInEmail.mockResolvedValue({
        error: null,
        data: { 
          user: { 
            id: 'super-admin-id', 
            email: 'admin@azaire.com',
            role: 'SUPER_ADMIN'
          },
          session: { id: 'session-id' }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@azaire.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { POST } = await import('@/app/api/superadmin/auth/login/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.email).toBe('admin@azaire.com')
      expect(data.user.role).toBe('SUPER_ADMIN')

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'SUPER_ADMIN_LOGIN' }
      })
      expect(auditLog).toBeTruthy()
      expect(auditLog?.details).toContain('admin@azaire.com')
    })

    it('should reject non-super admin users', async () => {
      const mockAuth = require('@/lib/auth').auth
      mockAuth.api.signInEmail.mockResolvedValue({
        error: null,
        data: { 
          user: { 
            id: 'user-id', 
            email: 'user@example.com',
            role: 'TENANT_ADMIN'
          },
          session: { id: 'session-id' }
        }
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { POST } = await import('@/app/api/superadmin/auth/login/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Access denied. Super Admin role required.')
    })

    it('should handle authentication errors', async () => {
      const mockAuth = require('@/lib/auth').auth
      mockAuth.api.signInEmail.mockResolvedValue({
        error: { message: 'Invalid credentials' }
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@azaire.com',
          password: 'wrongpassword'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const { POST } = await import('@/app/api/superadmin/auth/login/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid credentials')
    })
  })

  describe('POST /api/superadmin/auth/logout', () => {
    it('should logout super admin successfully', async () => {
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
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'SUPER_ADMIN_LOGOUT' }
      })
      expect(auditLog).toBeTruthy()
    })
  })

  describe('GET /api/superadmin/auth/me', () => {
    it('should return current super admin user', async () => {
      const { requireRole } = require('@/lib/auth-helpers')
      requireRole.mockResolvedValue({
        id: 'super-admin-id',
        email: 'admin@azaire.com',
        role: 'SUPER_ADMIN',
        name: 'Super Admin'
      })

      const request = new NextRequest('http://localhost:3000/api/superadmin/auth/me')

      const { GET } = await import('@/app/api/superadmin/auth/me/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.email).toBe('admin@azaire.com')
      expect(data.user.role).toBe('SUPER_ADMIN')
    })
  })
})
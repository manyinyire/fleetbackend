/**
 * Integration tests for API routes with new middleware
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma, cleanupDatabase, createTestTenant, createTestUser } from '../setup/test-db';

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  requireTenant: jest.fn(),
  requireRole: jest.fn(),
  requireAuth: jest.fn(),
}));

describe('API Routes with Middleware', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/drivers', () => {
    it('should return paginated drivers', async () => {
      const tenant = await createTestTenant();
      const user = await createTestUser({ tenantId: tenant.id, role: 'TENANT_ADMIN' });

      // Create test drivers
      await Promise.all([
        prisma.driver.create({
          data: {
            tenantId: tenant.id,
            fullName: 'John Doe',
            nationalId: '123456',
            licenseNumber: 'LIC123',
            phone: '+1234567890',
            homeAddress: '123 Main St',
            nextOfKin: 'Jane Doe',
            nextOfKinPhone: '+0987654321',
            paymentModel: 'DRIVER_REMITS',
            paymentConfig: { amount: 100 },
            status: 'ACTIVE',
          },
        }),
        prisma.driver.create({
          data: {
            tenantId: tenant.id,
            fullName: 'Jane Smith',
            nationalId: '654321',
            licenseNumber: 'LIC456',
            phone: '+1234567891',
            homeAddress: '456 Oak St',
            nextOfKin: 'John Smith',
            nextOfKinPhone: '+0987654322',
            paymentModel: 'OWNER_PAYS',
            paymentConfig: { percentage: 70 },
            status: 'ACTIVE',
          },
        }),
      ]);

      const { requireTenant } = require('@/lib/auth-helpers');
      requireTenant.mockResolvedValue({ user, tenantId: tenant.id });

      const request = new NextRequest('http://localhost:3000/api/drivers?page=1&limit=10');
      const { GET } = await import('@/app/api/drivers/route');
      const response = await GET(request, { params: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should filter drivers by status', async () => {
      const tenant = await createTestTenant();
      const user = await createTestUser({ tenantId: tenant.id, role: 'TENANT_ADMIN' });

      await Promise.all([
        prisma.driver.create({
          data: {
            tenantId: tenant.id,
            fullName: 'Active Driver',
            nationalId: '111111',
            licenseNumber: 'LIC111',
            phone: '+1111111111',
            homeAddress: '111 St',
            nextOfKin: 'Contact',
            nextOfKinPhone: '+2222222222',
            paymentModel: 'DRIVER_REMITS',
            paymentConfig: {},
            status: 'ACTIVE',
          },
        }),
        prisma.driver.create({
          data: {
            tenantId: tenant.id,
            fullName: 'Inactive Driver',
            nationalId: '222222',
            licenseNumber: 'LIC222',
            phone: '+3333333333',
            homeAddress: '222 St',
            nextOfKin: 'Contact',
            nextOfKinPhone: '+4444444444',
            paymentModel: 'DRIVER_REMITS',
            paymentConfig: {},
            status: 'INACTIVE',
          },
        }),
      ]);

      const { requireTenant } = require('@/lib/auth-helpers');
      requireTenant.mockResolvedValue({ user, tenantId: tenant.id });

      const request = new NextRequest('http://localhost:3000/api/drivers?status=ACTIVE');
      const { GET } = await import('@/app/api/drivers/route');
      const response = await GET(request, { params: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('ACTIVE');
    });
  });

  describe('POST /api/drivers', () => {
    it('should create a new driver with validation', async () => {
      const tenant = await createTestTenant();
      const user = await createTestUser({ tenantId: tenant.id, role: 'TENANT_ADMIN' });

      const { requireTenant } = require('@/lib/auth-helpers');
      requireTenant.mockResolvedValue({ user, tenantId: tenant.id });

      const driverData = {
        fullName: 'Test Driver',
        nationalId: '999999',
        licenseNumber: 'LIC999',
        phone: '+9999999999',
        email: 'test@example.com',
        homeAddress: '999 Test St',
        nextOfKin: 'Test Contact',
        nextOfKinPhone: '+8888888888',
        hasDefensiveLicense: false,
        paymentModel: 'DRIVER_REMITS',
        paymentConfig: { amount: 100, frequency: 'DAILY' },
        debtBalance: 0,
        status: 'ACTIVE',
      };

      const request = new NextRequest('http://localhost:3000/api/drivers', {
        method: 'POST',
        body: JSON.stringify(driverData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { POST } = await import('@/app/api/drivers/route');
      const response = await POST(request, { params: {} });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.fullName).toBe('Test Driver');
      expect(data.nationalId).toBe('999999');
    });

    it('should reject duplicate national ID', async () => {
      const tenant = await createTestTenant();
      const user = await createTestUser({ tenantId: tenant.id, role: 'TENANT_ADMIN' });

      // Create existing driver
      await prisma.driver.create({
        data: {
          tenantId: tenant.id,
          fullName: 'Existing Driver',
          nationalId: '123456',
          licenseNumber: 'LIC123',
          phone: '+1234567890',
          homeAddress: '123 St',
          nextOfKin: 'Contact',
          nextOfKinPhone: '+0987654321',
          paymentModel: 'DRIVER_REMITS',
          paymentConfig: {},
          status: 'ACTIVE',
        },
      });

      const { requireTenant } = require('@/lib/auth-helpers');
      requireTenant.mockResolvedValue({ user, tenantId: tenant.id });

      const driverData = {
        fullName: 'New Driver',
        nationalId: '123456', // Duplicate
        licenseNumber: 'LIC999',
        phone: '+9999999999',
        homeAddress: '999 St',
        nextOfKin: 'Contact',
        nextOfKinPhone: '+8888888888',
        paymentModel: 'DRIVER_REMITS',
        paymentConfig: {},
        status: 'ACTIVE',
      };

      const request = new NextRequest('http://localhost:3000/api/drivers', {
        method: 'POST',
        body: JSON.stringify(driverData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { POST } = await import('@/app/api/drivers/route');
      const response = await POST(request, { params: {} });

      expect(response.status).toBe(409);
    });
  });
});

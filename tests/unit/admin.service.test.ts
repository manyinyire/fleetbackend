import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdminService, PlatformAnalytics, TenantAnalytics, SystemHealth } from '@/services/admin.service';
import { prisma } from '@/lib/prisma';

/**
 * Unit Tests for AdminService
 * Tests platform analytics, tenant management, system health, and revenue tracking
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    vehicle: {
      count: jest.fn(),
    },
    driver: {
      count: jest.fn(),
    },
    remittance: {
      count: jest.fn(),
    },
    income: {
      aggregate: jest.fn(),
    },
    expense: {
      aggregate: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  dbLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    jest.clearAllMocks();
  });

  describe('getPlatformAnalytics', () => {
    it('should return comprehensive platform analytics', async () => {
      // Mock data
      const mockTenants = [
        { id: '1', name: 'Company A', plan: 'PREMIUM', monthlyRevenue: 99.99, _count: { users: 25 } },
        { id: '2', name: 'Company B', plan: 'BASIC', monthlyRevenue: 29.99, _count: { users: 10 } },
      ];

      const mockPlanDistribution = [
        { plan: 'FREE', _count: { plan: 10 } },
        { plan: 'BASIC', _count: { plan: 25 } },
        { plan: 'PREMIUM', _count: { plan: 15 } },
      ];

      (prisma.tenant.count as jest.Mock).mockImplementation(async (args?: any) => {
        if (args?.where?.status === 'ACTIVE') return 45;
        if (args?.where?.status === 'SUSPENDED') return 5;
        if (args?.where?.createdAt) return 12; // new tenants this month
        return 50; // total tenants
      });

      (prisma.user.count as jest.Mock).mockImplementation(async (args?: any) => {
        if (args?.where?.createdAt) return 85; // new users this month
        return 350; // total users
      });

      (prisma.tenant.aggregate as jest.Mock).mockResolvedValue({
        _sum: { monthlyRevenue: 4500.50 },
      });

      (prisma.tenant.groupBy as jest.Mock).mockResolvedValue(mockPlanDistribution);
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants);

      const result = await adminService.getPlatformAnalytics();

      expect(result).toBeDefined();
      expect(result.overview.totalTenants).toBe(50);
      expect(result.overview.activeTenants).toBe(45);
      expect(result.overview.suspendedTenants).toBe(5);
      expect(result.overview.totalUsers).toBe(350);
      expect(result.overview.totalRevenue).toBe(4500.50);

      expect(result.growth.newTenantsThisMonth).toBe(12);
      expect(result.growth.newUsersThisMonth).toBe(85);
      expect(result.growth.growthRate).toBe(24); // (12/50)*100

      expect(result.planDistribution.FREE).toBe(10);
      expect(result.planDistribution.BASIC).toBe(25);
      expect(result.planDistribution.PREMIUM).toBe(15);

      expect(result.topTenants).toHaveLength(2);
      expect(result.topTenants[0].name).toBe('Company A');
      expect(result.topTenants[0].monthlyRevenue).toBe(99.99);
    });

    it('should handle zero tenants gracefully', async () => {
      (prisma.tenant.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.tenant.aggregate as jest.Mock).mockResolvedValue({ _sum: { monthlyRevenue: null } });
      (prisma.tenant.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);

      const result = await adminService.getPlatformAnalytics();

      expect(result.overview.totalTenants).toBe(0);
      expect(result.overview.totalRevenue).toBe(0);
      expect(result.growth.growthRate).toBe(0);
      expect(result.topTenants).toHaveLength(0);
    });

    it('should calculate growth rate correctly', async () => {
      (prisma.tenant.count as jest.Mock).mockImplementation(async (args?: any) => {
        if (args?.where?.createdAt) return 5; // new tenants
        return 100; // total tenants
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      (prisma.tenant.aggregate as jest.Mock).mockResolvedValue({ _sum: { monthlyRevenue: 0 } });
      (prisma.tenant.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);

      const result = await adminService.getPlatformAnalytics();

      expect(result.growth.growthRate).toBe(5); // (5/100)*100
    });
  });

  describe('getTenantAnalytics', () => {
    it('should return comprehensive tenant analytics', async () => {
      const tenantId = 'tenant-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: tenantId,
        name: 'Test Company',
      });

      (prisma.vehicle.count as jest.Mock).mockResolvedValue(25);
      (prisma.driver.count as jest.Mock).mockResolvedValue(50);
      (prisma.remittance.count as jest.Mock).mockResolvedValue(120);
      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 50000 } });
      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 15000 } });
      (prisma.user.count as jest.Mock).mockResolvedValue(8);

      const result = await adminService.getTenantAnalytics(tenantId, startDate, endDate);

      expect(result.tenantId).toBe(tenantId);
      expect(result.vehicles).toBe(25);
      expect(result.drivers).toBe(50);
      expect(result.remittances).toBe(120);
      expect(result.revenue).toBe(50000);
      expect(result.expenses).toBe(15000);
      expect(result.profit).toBe(35000); // 50000 - 15000
      expect(result.activeUsers).toBe(8);
    });

    it('should calculate profit correctly', async () => {
      const tenantId = 'tenant-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: tenantId });
      (prisma.vehicle.count as jest.Mock).mockResolvedValue(0);
      (prisma.driver.count as jest.Mock).mockResolvedValue(0);
      (prisma.remittance.count as jest.Mock).mockResolvedValue(0);
      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 10000 } });
      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 12000 } });
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const result = await adminService.getTenantAnalytics(tenantId, startDate, endDate);

      expect(result.profit).toBe(-2000); // Loss: 10000 - 12000
    });

    it('should handle null aggregation values', async () => {
      const tenantId = 'tenant-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: tenantId });
      (prisma.vehicle.count as jest.Mock).mockResolvedValue(0);
      (prisma.driver.count as jest.Mock).mockResolvedValue(0);
      (prisma.remittance.count as jest.Mock).mockResolvedValue(0);
      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: null } });
      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: null } });
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const result = await adminService.getTenantAnalytics(tenantId, startDate, endDate);

      expect(result.revenue).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.profit).toBe(0);
    });

    it('should throw NotFoundError for non-existent tenant', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        adminService.getTenantAnalytics('invalid-id', new Date(), new Date())
      ).rejects.toThrow('Tenant not found');
    });
  });

  describe('updateTenantStatus', () => {
    it('should update tenant status to SUSPENDED', async () => {
      const tenantId = 'tenant-123';
      const userId = 'admin-1';
      const updatedTenant = {
        id: tenantId,
        status: 'SUSPENDED',
        suspendedAt: new Date(),
      };

      (prisma.tenant.update as jest.Mock).mockResolvedValue(updatedTenant);

      const result = await adminService.updateTenantStatus(tenantId, 'SUSPENDED', userId);

      expect(result.status).toBe('SUSPENDED');
      expect(result.suspendedAt).toBeDefined();
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: expect.any(Date),
        },
      });
    });

    it('should clear suspendedAt when activating tenant', async () => {
      const tenantId = 'tenant-123';
      const userId = 'admin-1';

      (prisma.tenant.update as jest.Mock).mockResolvedValue({
        id: tenantId,
        status: 'ACTIVE',
        suspendedAt: null,
      });

      await adminService.updateTenantStatus(tenantId, 'ACTIVE', userId);

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
        },
      });
    });
  });

  describe('getTenants', () => {
    it('should return paginated tenants list', async () => {
      const mockTenants = [
        {
          id: '1',
          name: 'Company A',
          email: 'a@example.com',
          status: 'ACTIVE',
          _count: { users: 10, vehicles: 5, drivers: 15 },
        },
        {
          id: '2',
          name: 'Company B',
          email: 'b@example.com',
          status: 'ACTIVE',
          _count: { users: 8, vehicles: 3, drivers: 10 },
        },
      ];

      (prisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants);
      (prisma.tenant.count as jest.Mock).mockResolvedValue(25);

      const result = await adminService.getTenants({ page: 1, limit: 10 });

      expect(result.tenants).toHaveLength(2);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(3); // ceil(25/10)
    });

    it('should filter by status', async () => {
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.count as jest.Mock).mockResolvedValue(5);

      await adminService.getTenants({ status: 'SUSPENDED' });

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SUSPENDED' }),
        })
      );
    });

    it('should filter by plan', async () => {
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.count as jest.Mock).mockResolvedValue(10);

      await adminService.getTenants({ plan: 'PREMIUM' });

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ plan: 'PREMIUM' }),
        })
      );
    });

    it('should support search across name, email, slug', async () => {
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.count as jest.Mock).mockResolvedValue(3);

      await adminService.getTenants({ search: 'test' });

      const callArgs = (prisma.tenant.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(3); // name, email, slug
    });

    it('should calculate pagination correctly', async () => {
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.tenant.count as jest.Mock).mockResolvedValue(47);

      const result = await adminService.getTenants({ page: 3, limit: 10 });

      expect(result.pagination.totalPages).toBe(5); // ceil(47/10)
      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1)*10
          take: 10,
        })
      );
    });
  });

  describe('getSystemHealth', () => {
    it('should return healthy status for fast database', async () => {
      const mockQueryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
      (prisma.$queryRaw as jest.Mock) = mockQueryRaw;

      const result = await adminService.getSystemHealth();

      expect(result.database.status).toBe('healthy');
      expect(result.database.responseTime).toBeLessThan(100);
    });

    it('should return degraded status for slow database', async () => {
      const mockQueryRaw = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return [{ '?column?': 1 }];
      });
      (prisma.$queryRaw as jest.Mock) = mockQueryRaw;

      const result = await adminService.getSystemHealth();

      expect(result.database.status).toBe('degraded');
      expect(result.database.responseTime).toBeGreaterThanOrEqual(150);
    });

    it('should return down status for very slow database', async () => {
      const mockQueryRaw = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return [{ '?column?': 1 }];
      });
      (prisma.$queryRaw as jest.Mock) = mockQueryRaw;

      const result = await adminService.getSystemHealth();

      expect(result.database.status).toBe('down');
      expect(result.database.responseTime).toBeGreaterThanOrEqual(500);
    });

    it('should return down status on database error', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await adminService.getSystemHealth();

      expect(result.database.status).toBe('down');
      expect(result.api.status).toBe('down');
      expect(result.api.errorRate).toBe(100);
    });
  });

  describe('getUserActivity', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: '1',
          action: 'TENANT_CREATED',
          details: 'Created new tenant',
          userId: 'user-1',
          user: { id: 'user-1', name: 'Admin', email: 'admin@test.com' },
          createdAt: new Date(),
        },
        {
          id: '2',
          action: 'USER_CREATED',
          details: 'Created new user',
          userId: 'user-1',
          user: { id: 'user-1', name: 'Admin', email: 'admin@test.com' },
          createdAt: new Date(),
        },
      ];

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(150);

      const result = await adminService.getUserActivity({ page: 1, limit: 50 });

      expect(result.logs).toHaveLength(2);
      expect(result.pagination.total).toBe(150);
      expect(result.pagination.totalPages).toBe(3); // ceil(150/50)
    });

    it('should filter by userId', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      await adminService.getUserActivity({ userId: 'user-123' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-123' }),
        })
      );
    });

    it('should filter by tenantId', async () => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      await adminService.getUserActivity({ tenantId: 'tenant-123' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-123' }),
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);

      await adminService.getUserActivity({ startDate, endDate });

      const callArgs = (prisma.auditLog.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.createdAt.gte).toEqual(startDate);
      expect(callArgs.where.createdAt.lte).toEqual(endDate);
    });
  });

  describe('getRevenueReport', () => {
    it('should calculate total MRR correctly', async () => {
      const mockTenants = [
        { id: '1', name: 'A', plan: 'BASIC', monthlyRevenue: 29.99, createdAt: new Date('2024-01-01') },
        { id: '2', name: 'B', plan: 'PREMIUM', monthlyRevenue: 99.99, createdAt: new Date('2024-02-01') },
        { id: '3', name: 'C', plan: 'BASIC', monthlyRevenue: 29.99, createdAt: new Date('2024-03-01') },
      ];

      (prisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants);

      const result = await adminService.getRevenueReport(new Date(), new Date());

      expect(result.totalMRR).toBe(159.97); // 29.99 + 99.99 + 29.99
      expect(result.payingTenants).toBe(3);
      expect(result.avgRevenuePerTenant).toBeCloseTo(53.32, 2); // 159.97/3
    });

    it('should group revenue by plan', async () => {
      const mockTenants = [
        { id: '1', name: 'A', plan: 'BASIC', monthlyRevenue: 29.99, createdAt: new Date() },
        { id: '2', name: 'B', plan: 'PREMIUM', monthlyRevenue: 99.99, createdAt: new Date() },
        { id: '3', name: 'C', plan: 'BASIC', monthlyRevenue: 29.99, createdAt: new Date() },
      ];

      (prisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants);

      const result = await adminService.getRevenueReport(new Date(), new Date());

      expect(result.revenueByPlan.BASIC).toBe(59.98); // 29.99 + 29.99
      expect(result.revenueByPlan.PREMIUM).toBe(99.99);
    });

    it('should calculate lifetime value correctly', async () => {
      const createdAt = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      const mockTenants = [
        { id: '1', name: 'A', plan: 'PREMIUM', monthlyRevenue: 99.99, createdAt },
      ];

      (prisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants);

      const result = await adminService.getRevenueReport(new Date(), new Date());

      expect(result.tenants[0].lifetimeValue).toBeGreaterThan(200); // ~3 months * 99.99
    });

    it('should handle zero paying tenants', async () => {
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);

      const result = await adminService.getRevenueReport(new Date(), new Date());

      expect(result.totalMRR).toBe(0);
      expect(result.avgRevenuePerTenant).toBe(0);
      expect(result.payingTenants).toBe(0);
    });

    it('should exclude FREE plan tenants', async () => {
      (prisma.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await adminService.getRevenueReport(new Date(), new Date());

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            plan: { not: 'FREE' },
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('impersonateTenant', () => {
    it('should return tenant admin user for impersonation', async () => {
      const tenantId = 'tenant-123';
      const adminUserId = 'admin-1';
      const mockTenant = {
        id: tenantId,
        name: 'Test Company',
        plan: 'BASIC',
        users: [
          { id: 'user-1', role: 'TENANT_ADMIN', email: 'admin@test.com' },
        ],
      };

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await adminService.impersonateTenant(tenantId, adminUserId);

      expect(result.userId).toBe('user-1');
      expect(result.tenantId).toBe(tenantId);
      expect(result.tenant.name).toBe('Test Company');
      expect(result.tenant.plan).toBe('BASIC');
    });

    it('should throw NotFoundError for non-existent tenant', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        adminService.impersonateTenant('invalid-id', 'admin-1')
      ).rejects.toThrow('Tenant not found');
    });

    it('should throw NotFoundError when no admin user exists', async () => {
      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Company',
        users: [], // No admin users
      };

      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(
        adminService.impersonateTenant('tenant-123', 'admin-1')
      ).rejects.toThrow('Tenant admin user not found');
    });
  });
});

/**
 * Super Admin Service Layer
 *
 * Business logic for super admin operations including:
 * - Platform-wide analytics
 * - Tenant management
 * - User management
 * - System health monitoring
 * - Revenue tracking
 */

import { PrismaClient, TenantStatus, SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbLogger } from '@/lib/logger';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  handlePrismaError,
} from '@/lib/errors';

export interface PlatformAnalytics {
  overview: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    totalUsers: number;
    totalRevenue: number;
  };
  growth: {
    newTenantsThisMonth: number;
    newUsersThisMonth: number;
    revenueThisMonth: number;
    growthRate: number;
  };
  planDistribution: Record<SubscriptionPlan, number>;
  topTenants: Array<{
    id: string;
    name: string;
    plan: SubscriptionPlan;
    monthlyRevenue: number;
    userCount: number;
  }>;
}

export interface TenantAnalytics {
  tenantId: string;
  vehicles: number;
  drivers: number;
  remittances: number;
  revenue: number;
  expenses: number;
  profit: number;
  activeUsers: number;
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    connections: number;
  };
  api: {
    status: 'healthy' | 'degraded' | 'down';
    avgResponseTime: number;
    errorRate: number;
  };
  storage: {
    used: number;
    available: number;
    percentUsed: number;
  };
}

export class AdminService {
  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(startDate?: Date, endDate?: Date): Promise<PlatformAnalytics> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get overview data
      const [
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        totalRevenue,
        newTenantsThisMonth,
        newUsersThisMonth,
        planDistribution,
      ] = await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
        prisma.user.count({ where: { tenantId: { not: null } } }),
        prisma.tenant.aggregate({
          _sum: { monthlyRevenue: true },
        }),
        prisma.tenant.count({
          where: {
            createdAt: { gte: firstDayOfMonth },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: firstDayOfMonth },
            tenantId: { not: null },
          },
        }),
        prisma.tenant.groupBy({
          by: ['plan'],
          _count: { plan: true },
        }),
      ]);

      // Get top tenants
      const topTenants = await prisma.tenant.findMany({
        take: 10,
        orderBy: {
          monthlyRevenue: 'desc',
        },
        select: {
          id: true,
          name: true,
          plan: true,
          monthlyRevenue: true,
          _count: {
            select: { users: true },
          },
        },
      });

      const planDistributionMap: Record<SubscriptionPlan, number> = {
        FREE: 0,
        BASIC: 0,
        PREMIUM: 0,
      };

      planDistribution.forEach(item => {
        planDistributionMap[item.plan] = item._count.plan;
      });

      return {
        overview: {
          totalTenants,
          activeTenants,
          suspendedTenants,
          totalUsers,
          totalRevenue: Number(totalRevenue._sum.monthlyRevenue || 0),
        },
        growth: {
          newTenantsThisMonth,
          newUsersThisMonth,
          revenueThisMonth: 0, // Would need invoice data
          growthRate: totalTenants > 0 ? (newTenantsThisMonth / totalTenants) * 100 : 0,
        },
        planDistribution: planDistributionMap,
        topTenants: topTenants.map(t => ({
          id: t.id,
          name: t.name,
          plan: t.plan,
          monthlyRevenue: Number(t.monthlyRevenue),
          userCount: t._count.users,
        })),
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting platform analytics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get analytics for a specific tenant
   */
  async getTenantAnalytics(tenantId: string, startDate: Date, endDate: Date): Promise<TenantAnalytics> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      const dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      const [
        vehicles,
        drivers,
        remittances,
        revenue,
        expenses,
        activeUsers,
      ] = await Promise.all([
        prisma.vehicle.count({ where: { tenantId } }),
        prisma.driver.count({ where: { tenantId } }),
        prisma.remittance.count({ where: { tenantId, ...dateFilter } }),
        prisma.income.aggregate({
          where: { tenantId, ...dateFilter },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { tenantId, status: 'APPROVED', ...dateFilter },
          _sum: { amount: true },
        }),
        prisma.user.count({
          where: {
            tenantId,
            lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const revenueTotal = Number(revenue._sum.amount || 0);
      const expensesTotal = Number(expenses._sum.amount || 0);

      return {
        tenantId,
        vehicles,
        drivers,
        remittances,
        revenue: revenueTotal,
        expenses: expensesTotal,
        profit: revenueTotal - expensesTotal,
        activeUsers,
      };
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Error getting tenant analytics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Update tenant status
   */
  async updateTenantStatus(
    tenantId: string,
    status: TenantStatus,
    userId: string
  ) {
    try {
      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status,
          suspendedAt: status === 'SUSPENDED' ? new Date() : null,
        },
      });

      dbLogger.info(
        {
          tenantId,
          status,
          userId,
        },
        `Tenant status updated to ${status}`
      );

      return tenant;
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Error updating tenant status');
      throw handlePrismaError(error);
    }
  }

  /**
   * Update tenant plan
   * @deprecated Use SubscriptionService.changePlan instead for proper lifecycle management
   */
  async updateTenantPlan(
    tenantId: string,
    plan: SubscriptionPlan,
    userId: string
  ) {
    try {
      // Import subscription service dynamically to avoid circular dependency
      const { subscriptionService } = await import('./subscription.service');

      // Get plan pricing from subscription service
      const planConfig = await subscriptionService.getPlanConfig(plan);

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan,
          monthlyRevenue: planConfig.monthlyPrice,
        },
      });

      dbLogger.info(
        {
          tenantId,
          plan,
          userId,
        },
        `Tenant plan updated to ${plan}`
      );

      return tenant;
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Error updating tenant plan');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get all tenants with filters
   */
  async getTenants(filters: {
    status?: TenantStatus;
    plan?: SubscriptionPlan;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const { status, plan, search, page = 1, limit = 10 } = filters;

      const where: any = {};
      if (status) where.status = status;
      if (plan) where.plan = plan;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          include: {
            _count: {
              select: {
                users: true,
                vehicles: true,
                drivers: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.tenant.count({ where }),
      ]);

      return {
        tenants,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting tenants');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Test database connection
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbDuration = Date.now() - dbStart;

      return {
        database: {
          status: dbDuration < 100 ? 'healthy' : dbDuration < 500 ? 'degraded' : 'down',
          responseTime: dbDuration,
          connections: 0, // Would need to query pg_stat_activity
        },
        api: {
          status: 'healthy',
          avgResponseTime: 0, // Would need metrics from monitoring
          errorRate: 0, // Would need error tracking
        },
        storage: {
          used: 0, // Would need to check S3/storage
          available: 0,
          percentUsed: 0,
        },
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting system health');
      return {
        database: {
          status: 'down',
          responseTime: 0,
          connections: 0,
        },
        api: {
          status: 'down',
          avgResponseTime: 0,
          errorRate: 100,
        },
        storage: {
          used: 0,
          available: 0,
          percentUsed: 0,
        },
      };
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivity(filters: {
    userId?: string;
    tenantId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const { userId, tenantId, startDate, endDate, page = 1, limit = 50 } = filters;

      const where: any = {};
      if (userId) where.userId = userId;
      if (tenantId) where.tenantId = tenantId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting user activity');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(startDate: Date, endDate: Date) {
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          status: 'ACTIVE',
          plan: {
            not: 'FREE',
          },
        },
        select: {
          id: true,
          name: true,
          plan: true,
          monthlyRevenue: true,
          createdAt: true,
        },
      });

      const totalMRR = tenants.reduce((sum, t) => sum + Number(t.monthlyRevenue), 0);
      const avgRevenuePerTenant = tenants.length > 0 ? totalMRR / tenants.length : 0;

      // Group by plan
      const revenueByPlan = tenants.reduce((acc, t) => {
        const plan = t.plan;
        acc[plan] = (acc[plan] || 0) + Number(t.monthlyRevenue);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalMRR,
        avgRevenuePerTenant,
        payingTenants: tenants.length,
        revenueByPlan,
        tenants: tenants.map(t => ({
          id: t.id,
          name: t.name,
          plan: t.plan,
          monthlyRevenue: Number(t.monthlyRevenue),
          lifetimeValue: this.calculateLifetimeValue(t.createdAt, Number(t.monthlyRevenue)),
        })),
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting revenue report');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate customer lifetime value
   */
  private calculateLifetimeValue(createdAt: Date, monthlyRevenue: number): number {
    const monthsActive = Math.ceil(
      (Date.now() - createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    return monthsActive * monthlyRevenue;
  }

  /**
   * Impersonate tenant user
   */
  async impersonateTenant(tenantId: string, adminUserId: string) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: {
              role: {
                contains: 'TENANT_ADMIN',
              },
            },
            take: 1,
          },
        },
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      if (tenant.users.length === 0) {
        throw new NotFoundError('Tenant admin user');
      }

      const tenantUser = tenant.users[0];

      dbLogger.info(
        {
          adminUserId,
          tenantId,
          impersonatedUserId: tenantUser.id,
        },
        'Admin impersonating tenant user'
      );

      return {
        userId: tenantUser.id,
        tenantId,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Error impersonating tenant');
      throw handlePrismaError(error);
    }
  }
}

/**
 * Subscription Analytics Service
 *
 * Calculates and tracks subscription metrics including:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Churn Rate
 * - Conversion Rates
 * - Revenue by plan
 */

import { prisma } from '@/lib/prisma';
import { dbLogger } from '@/lib/logger';
import { SubscriptionPlan, BillingCycle } from '@prisma/client';
import { handlePrismaError } from '@/lib/errors';

// ============================================
// TYPES
// ============================================

export interface SubscriptionMetricsData {
  date: Date;
  mrr: number;
  arr: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  canceledSubscriptions: number;
  freeCount: number;
  basicCount: number;
  premiumCount: number;
  churnedCount: number;
  churnRate: number;
  trialToBasic: number;
  trialToPremium: number;
  basicToPremium: number;
  newRevenue: number;
  churnedRevenue: number;
  expansionRevenue: number;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  arpu: number; // Average Revenue Per User
  ltv: number; // Lifetime Value estimate
  revenueByPlan: Record<SubscriptionPlan, number>;
}

export interface ChurnMetrics {
  churnRate: number;
  churnedCount: number;
  churnedRevenue: number;
  retentionRate: number;
}

export interface ConversionMetrics {
  trialToBasic: number;
  trialToPremium: number;
  basicToPremium: number;
  trialConversionRate: number;
  upgradeRate: number;
}

// ============================================
// SUBSCRIPTION ANALYTICS SERVICE
// ============================================

export class SubscriptionAnalyticsService {
  /**
   * Calculate current MRR (Monthly Recurring Revenue)
   */
  async calculateMRR(): Promise<number> {
    try {
      const result = await prisma.tenant.aggregate({
        where: {
          status: 'ACTIVE',
          plan: { not: 'FREE' }
        },
        _sum: {
          monthlyRevenue: true
        }
      });

      return Number(result._sum.monthlyRevenue || 0);
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to calculate MRR');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate ARR (Annual Recurring Revenue)
   */
  async calculateARR(): Promise<number> {
    const mrr = await this.calculateMRR();
    return mrr * 12;
  }

  /**
   * Calculate ARPU (Average Revenue Per User)
   */
  async calculateARPU(): Promise<number> {
    try {
      const [mrr, activeCount] = await Promise.all([
        this.calculateMRR(),
        prisma.tenant.count({
          where: {
            status: 'ACTIVE',
            plan: { not: 'FREE' }
          }
        })
      ]);

      return activeCount > 0 ? mrr / activeCount : 0;
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to calculate ARPU');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate churn metrics for a given period
   */
  async calculateChurnMetrics(startDate: Date, endDate: Date): Promise<ChurnMetrics> {
    try {
      // Get tenants that canceled in the period
      const churned = await prisma.tenant.findMany({
        where: {
          canceledAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          monthlyRevenue: true
        }
      });

      // Get active tenants at start of period
      const activeAtStart = await prisma.tenant.count({
        where: {
          status: 'ACTIVE',
          createdAt: { lt: startDate }
        }
      });

      const churnedCount = churned.length;
      const churnedRevenue = churned.reduce((sum, t) => sum + Number(t.monthlyRevenue), 0);
      const churnRate = activeAtStart > 0 ? (churnedCount / activeAtStart) * 100 : 0;
      const retentionRate = 100 - churnRate;

      return {
        churnRate: Number(churnRate.toFixed(2)),
        churnedCount,
        churnedRevenue: Number(churnedRevenue.toFixed(2)),
        retentionRate: Number(retentionRate.toFixed(2))
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to calculate churn metrics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate conversion metrics for a given period
   */
  async calculateConversionMetrics(startDate: Date, endDate: Date): Promise<ConversionMetrics> {
    try {
      const history = await prisma.subscriptionHistory.findMany({
        where: {
          effectiveDate: {
            gte: startDate,
            lte: endDate
          },
          changeType: {
            in: ['TRIAL_END', 'UPGRADE']
          }
        }
      });

      let trialToBasic = 0;
      let trialToPremium = 0;
      let basicToPremium = 0;
      let totalTrialConversions = 0;

      history.forEach(record => {
        if (record.changeType === 'TRIAL_END') {
          totalTrialConversions++;
          if (record.toPlan === 'BASIC') trialToBasic++;
          if (record.toPlan === 'PREMIUM') trialToPremium++;
        } else if (record.changeType === 'UPGRADE') {
          if (record.fromPlan === 'BASIC' && record.toPlan === 'PREMIUM') {
            basicToPremium++;
          }
        }
      });

      // Count total trials that ended in the period
      const totalTrialsEnded = await prisma.tenant.count({
        where: {
          isInTrial: false,
          trialEndDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const trialConversionRate = totalTrialsEnded > 0
        ? ((trialToBasic + trialToPremium) / totalTrialsEnded) * 100
        : 0;

      const totalBasic = await prisma.tenant.count({
        where: { plan: 'BASIC' }
      });

      const upgradeRate = totalBasic > 0
        ? (basicToPremium / totalBasic) * 100
        : 0;

      return {
        trialToBasic,
        trialToPremium,
        basicToPremium,
        trialConversionRate: Number(trialConversionRate.toFixed(2)),
        upgradeRate: Number(upgradeRate.toFixed(2))
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to calculate conversion metrics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate revenue breakdown by plan
   */
  async calculateRevenueByPlan(): Promise<Record<SubscriptionPlan, number>> {
    try {
      const tenants = await prisma.tenant.groupBy({
        by: ['plan'],
        where: {
          status: 'ACTIVE',
          plan: { not: 'FREE' }
        },
        _sum: {
          monthlyRevenue: true
        }
      });

      const revenueByPlan: Record<SubscriptionPlan, number> = {
        FREE: 0,
        BASIC: 0,
        PREMIUM: 0
      };

      tenants.forEach(group => {
        revenueByPlan[group.plan] = Number(group._sum.monthlyRevenue || 0);
      });

      return revenueByPlan;
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to calculate revenue by plan');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get comprehensive revenue metrics
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const [mrr, arr, arpu, revenueByPlan] = await Promise.all([
        this.calculateMRR(),
        this.calculateARR(),
        this.calculateARPU(),
        this.calculateRevenueByPlan()
      ]);

      // Simple LTV calculation: ARPU * average customer lifetime (assume 24 months)
      const ltv = arpu * 24;

      return {
        mrr: Number(mrr.toFixed(2)),
        arr: Number(arr.toFixed(2)),
        arpu: Number(arpu.toFixed(2)),
        ltv: Number(ltv.toFixed(2)),
        revenueByPlan
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to get revenue metrics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate and store daily metrics snapshot
   */
  async recordDailyMetrics(date: Date = new Date()): Promise<SubscriptionMetricsData> {
    try {
      // Normalize date to midnight
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      // Get plan distribution
      const planDistribution = await prisma.tenant.groupBy({
        by: ['plan'],
        _count: { plan: true }
      });

      const planCounts = {
        FREE: 0,
        BASIC: 0,
        PREMIUM: 0
      };

      planDistribution.forEach(group => {
        planCounts[group.plan] = group._count.plan;
      });

      // Get subscription counts
      const [totalSubscriptions, activeSubscriptions, trialSubscriptions, canceledSubscriptions] = await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        prisma.tenant.count({ where: { isInTrial: true } }),
        prisma.tenant.count({ where: { status: 'CANCELED' } })
      ]);

      // Get revenue metrics
      const revenueMetrics = await this.getRevenueMetrics();

      // Get churn metrics (last 30 days)
      const thirtyDaysAgo = new Date(normalizedDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const churnMetrics = await this.calculateChurnMetrics(thirtyDaysAgo, normalizedDate);

      // Get conversion metrics (last 30 days)
      const conversionMetrics = await this.calculateConversionMetrics(thirtyDaysAgo, normalizedDate);

      // Calculate new revenue (subscriptions that started in the last 30 days)
      const newTenants = await prisma.tenant.findMany({
        where: {
          subscriptionStartDate: {
            gte: thirtyDaysAgo,
            lte: normalizedDate
          },
          plan: { not: 'FREE' }
        },
        select: { monthlyRevenue: true }
      });

      const newRevenue = newTenants.reduce((sum, t) => sum + Number(t.monthlyRevenue), 0);

      // Calculate expansion revenue (upgrades in the last 30 days)
      const upgrades = await prisma.subscriptionHistory.findMany({
        where: {
          changeType: 'UPGRADE',
          effectiveDate: {
            gte: thirtyDaysAgo,
            lte: normalizedDate
          }
        },
        select: { proratedAmount: true }
      });

      const expansionRevenue = upgrades.reduce((sum, u) => sum + Number(u.proratedAmount || 0), 0);

      const metricsData: SubscriptionMetricsData = {
        date: normalizedDate,
        mrr: revenueMetrics.mrr,
        arr: revenueMetrics.arr,
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        canceledSubscriptions,
        freeCount: planCounts.FREE,
        basicCount: planCounts.BASIC,
        premiumCount: planCounts.PREMIUM,
        churnedCount: churnMetrics.churnedCount,
        churnRate: churnMetrics.churnRate,
        trialToBasic: conversionMetrics.trialToBasic,
        trialToPremium: conversionMetrics.trialToPremium,
        basicToPremium: conversionMetrics.basicToPremium,
        newRevenue: Number(newRevenue.toFixed(2)),
        churnedRevenue: churnMetrics.churnedRevenue,
        expansionRevenue: Number(expansionRevenue.toFixed(2))
      };

      // Store in database
      await prisma.subscriptionMetrics.upsert({
        where: { date: normalizedDate },
        update: metricsData,
        create: metricsData
      });

      dbLogger.info({ date: normalizedDate }, 'Daily subscription metrics recorded');

      return metricsData;
    } catch (error) {
      dbLogger.error({ err: error, date }, 'Failed to record daily metrics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get metrics for a date range
   */
  async getMetricsForRange(startDate: Date, endDate: Date): Promise<SubscriptionMetricsData[]> {
    try {
      const metrics = await prisma.subscriptionMetrics.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      });

      return metrics.map(m => ({
        date: m.date,
        mrr: Number(m.mrr),
        arr: Number(m.arr),
        totalSubscriptions: m.totalSubscriptions,
        activeSubscriptions: m.activeSubscriptions,
        trialSubscriptions: m.trialSubscriptions,
        canceledSubscriptions: m.canceledSubscriptions,
        freeCount: m.freeCount,
        basicCount: m.basicCount,
        premiumCount: m.premiumCount,
        churnedCount: m.churnedCount,
        churnRate: Number(m.churnRate),
        trialToBasic: m.trialToBasic,
        trialToPremium: m.trialToPremium,
        basicToPremium: m.basicToPremium,
        newRevenue: Number(m.newRevenue),
        churnedRevenue: Number(m.churnedRevenue),
        expansionRevenue: Number(m.expansionRevenue)
      }));
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to get metrics for range');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get MRR growth over time
   */
  async getMRRGrowth(months: number = 12): Promise<Array<{ month: string; mrr: number }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const metrics = await this.getMetricsForRange(startDate, endDate);

      // Group by month
      const mrrByMonth = new Map<string, number>();

      metrics.forEach(metric => {
        const monthKey = `${metric.date.getFullYear()}-${String(metric.date.getMonth() + 1).padStart(2, '0')}`;
        if (!mrrByMonth.has(monthKey)) {
          mrrByMonth.set(monthKey, metric.mrr);
        }
      });

      return Array.from(mrrByMonth.entries()).map(([month, mrr]) => ({
        month,
        mrr
      }));
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to get MRR growth');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get top revenue-generating tenants
   */
  async getTopRevenuegenants(limit: number = 10) {
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          status: 'ACTIVE',
          plan: { not: 'FREE' }
        },
        select: {
          id: true,
          name: true,
          plan: true,
          monthlyRevenue: true,
          subscriptionStartDate: true
        },
        orderBy: {
          monthlyRevenue: 'desc'
        },
        take: limit
      });

      return tenants.map(t => ({
        ...t,
        monthlyRevenue: Number(t.monthlyRevenue),
        lifetimeValue: this.calculateTenantLTV(t.subscriptionStartDate, Number(t.monthlyRevenue))
      }));
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to get top revenue tenants');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate tenant lifetime value
   */
  private calculateTenantLTV(subscriptionStart: Date | null, monthlyRevenue: number): number {
    if (!subscriptionStart) return 0;

    const monthsActive = Math.ceil(
      (Date.now() - subscriptionStart.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );

    return monthsActive * monthlyRevenue;
  }
}

export const subscriptionAnalyticsService = new SubscriptionAnalyticsService();

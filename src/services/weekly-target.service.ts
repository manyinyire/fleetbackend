/**
 * Weekly Target Service
 *
 * Handles weekly remittance target tracking and debt carry-over logic
 * - Tracks Sunday-Saturday weekly cycles
 * - Carries over uncleared balances to next week
 * - Calculates total targets (base + carried debt)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { dbLogger } from '@/lib/logger';
import { handlePrismaError } from '@/lib/errors';

export interface WeeklyTargetData {
  driverId: string;
  vehicleId: string;
  baseTarget: number;
}

export class WeeklyTargetService {
  private prisma: PrismaClient;
  private tenantId: string | null;

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
    this.prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;
  }

  /**
   * Get the Sunday of the current week
   */
  private getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday (day 0)
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }

  /**
   * Get the Saturday of the current week
   */
  private getWeekEnd(date: Date = new Date()): Date {
    const sunday = this.getWeekStart(date);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    return saturday;
  }

  /**
   * Create or get current week's target for a driver
   */
  async getOrCreateWeeklyTarget(data: WeeklyTargetData) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const weekStart = this.getWeekStart();
      const weekEnd = this.getWeekEnd();

      // Check if target already exists for this week
      let target = await this.prisma.weeklyTarget.findFirst({
        where: {
          driverId: data.driverId,
          weekStart,
        },
      });

      if (!target) {
        // Get previous week's shortfall
        const previousWeekStart = new Date(weekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);

        const previousWeek = await this.prisma.weeklyTarget.findFirst({
          where: {
            driverId: data.driverId,
            weekStart: previousWeekStart,
          },
        });

        const carriedDebt = previousWeek?.shortfall || 0;
        const totalTarget = data.baseTarget + Number(carriedDebt);

        // Create new weekly target
        target = await this.prisma.weeklyTarget.create({
          data: {
            tenantId: this.tenantId!,
            driverId: data.driverId,
            vehicleId: data.vehicleId,
            weekStart,
            weekEnd,
            baseTarget: data.baseTarget,
            carriedDebt,
            totalTarget,
            totalRemitted: 0,
            shortfall: totalTarget, // Initially, all is shortfall
            status: 'ACTIVE',
          },
        });

        dbLogger.info(
          {
            targetId: target.id,
            driverId: data.driverId,
            weekStart,
            baseTarget: data.baseTarget,
            carriedDebt,
            totalTarget,
          },
          'Weekly target created'
        );
      }

      return target;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error creating weekly target');
      throw handlePrismaError(error);
    }
  }

  /**
   * Update weekly target when a remittance is made
   */
  async updateTargetWithRemittance(driverId: string, amount: number, date: Date = new Date()) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const weekStart = this.getWeekStart(date);

      const target = await this.prisma.weeklyTarget.findFirst({
        where: {
          driverId,
          weekStart,
        },
      });

      if (!target) {
        throw new Error('Weekly target not found for this period');
      }

      const newTotalRemitted = Number(target.totalRemitted) + amount;
      const newShortfall = Math.max(0, Number(target.totalTarget) - newTotalRemitted);

      await this.prisma.weeklyTarget.update({
        where: { id: target.id },
        data: {
          totalRemitted: newTotalRemitted,
          shortfall: newShortfall,
        },
      });

      dbLogger.info(
        {
          targetId: target.id,
          driverId,
          amount,
          newTotalRemitted,
          newShortfall,
        },
        'Weekly target updated with remittance'
      );

      return this.prisma.weeklyTarget.findUnique({ where: { id: target.id } });
    } catch (error) {
      dbLogger.error({ err: error, driverId, amount }, 'Error updating weekly target');
      throw handlePrismaError(error);
    }
  }

  /**
   * Close all weekly targets for the previous week
   * Called by cron job on Sunday
   */
  async closeLastWeek() {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const today = new Date();
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - 7);
      const lastWeekStartSunday = this.getWeekStart(lastWeekStart);

      const activeTargets = await this.prisma.weeklyTarget.findMany({
        where: {
          weekStart: lastWeekStartSunday,
          status: 'ACTIVE',
        },
      });

      const results = await Promise.all(
        activeTargets.map(async (target) => {
          return this.prisma.weeklyTarget.update({
            where: { id: target.id },
            data: {
              status: 'CLOSED',
              closedAt: new Date(),
            },
          });
        })
      );

      dbLogger.info(
        {
          weekStart: lastWeekStartSunday,
          closedCount: results.length,
        },
        'Closed last week targets'
      );

      return results;
    } catch (error) {
      dbLogger.error({ err: error }, 'Error closing last week targets');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get driver's current week target summary
   */
  async getDriverWeekSummary(driverId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const weekStart = this.getWeekStart();

      const target = await this.prisma.weeklyTarget.findFirst({
        where: {
          driverId,
          weekStart,
        },
        include: {
          driver: {
            select: {
              fullName: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              registrationNumber: true,
              make: true,
              model: true,
            },
          },
        },
      });

      if (!target) {
        return null;
      }

      const remittances = await this.prisma.remittance.findMany({
        where: {
          driverId,
          date: {
            gte: weekStart,
            lte: this.getWeekEnd(),
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      return {
        target,
        remittances,
        summary: {
          weekStart: target.weekStart,
          weekEnd: target.weekEnd,
          baseTarget: Number(target.baseTarget),
          carriedDebt: Number(target.carriedDebt),
          totalTarget: Number(target.totalTarget),
          totalRemitted: Number(target.totalRemitted),
          shortfall: Number(target.shortfall),
          percentage: Math.round((Number(target.totalRemitted) / Number(target.totalTarget)) * 100),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, driverId }, 'Error getting driver week summary');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get all drivers' weekly targets
   */
  async getAllDriversWeekSummary() {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const weekStart = this.getWeekStart();

      const targets = await this.prisma.weeklyTarget.findMany({
        where: {
          weekStart,
          status: 'ACTIVE',
        },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              registrationNumber: true,
            },
          },
        },
        orderBy: {
          shortfall: 'desc', // Show those with highest shortfall first
        },
      });

      return targets.map((target) => ({
        ...target,
        baseTarget: Number(target.baseTarget),
        carriedDebt: Number(target.carriedDebt),
        totalTarget: Number(target.totalTarget),
        totalRemitted: Number(target.totalRemitted),
        shortfall: Number(target.shortfall),
        percentage: Math.round((Number(target.totalRemitted) / Number(target.totalTarget)) * 100),
      }));
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting all drivers week summary');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get weekly target history for a driver
   */
  async getDriverHistory(driverId: string, limit: number = 10) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const targets = await this.prisma.weeklyTarget.findMany({
        where: {
          driverId,
        },
        orderBy: {
          weekStart: 'desc',
        },
        take: limit,
      });

      return targets.map((target) => ({
        ...target,
        baseTarget: Number(target.baseTarget),
        carriedDebt: Number(target.carriedDebt),
        totalTarget: Number(target.totalTarget),
        totalRemitted: Number(target.totalRemitted),
        shortfall: Number(target.shortfall),
        percentage: Number(target.totalTarget) > 0
          ? Math.round((Number(target.totalRemitted) / Number(target.totalTarget)) * 100)
          : 0,
      }));
    } catch (error) {
      dbLogger.error({ err: error, driverId }, 'Error getting driver history');
      throw handlePrismaError(error);
    }
  }
}

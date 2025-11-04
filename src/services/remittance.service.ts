/**
 * Remittance Service Layer
 *
 * Business logic for remittance management including:
 * - Remittance submission and approval
 * - Target calculation
 * - Payment tracking
 * - Reporting and analytics
 */

import { PrismaClient, RemittanceStatus } from '@prisma/client';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { dbLogger } from '@/lib/logger';
import {
  NotFoundError,
  ValidationError,
  handlePrismaError,
} from '@/lib/errors';

export interface CreateRemittanceDTO {
  driverId: string;
  vehicleId: string;
  amount: number;
  date: Date;
  proofOfPayment?: string;
  notes?: string;
}

export interface UpdateRemittanceDTO {
  amount?: number;
  date?: Date;
  proofOfPayment?: string;
  notes?: string;
}

export interface ApproveRemittanceDTO {
  remittanceId: string;
  approvedBy: string;
}

export interface RejectRemittanceDTO {
  remittanceId: string;
  notes: string;
}

export interface RemittanceFilters {
  driverId?: string;
  vehicleId?: string;
  status?: RemittanceStatus;
  targetReached?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class RemittanceService {
  private prisma: PrismaClient;
  private tenantId: string | null;

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
    this.prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;
  }

  /**
   * Calculate target amount based on vehicle payment configuration
   */
  private async calculateTarget(vehicleId: string): Promise<number | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        paymentModel: true,
        paymentConfig: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Only DRIVER_REMITS model has a target
    if (vehicle.paymentModel === 'DRIVER_REMITS') {
      const config = vehicle.paymentConfig as any;
      return config?.dailyTarget || config?.target || null;
    }

    return null;
  }

  /**
   * Create a new remittance
   */
  async create(data: CreateRemittanceDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Validate amount
      if (data.amount <= 0) {
        throw new ValidationError('Remittance amount must be positive');
      }

      // Verify driver exists
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.driverId },
      });

      if (!driver) {
        throw new NotFoundError('Driver');
      }

      // Verify vehicle exists
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle');
      }

      // Calculate target amount
      const targetAmount = await this.calculateTarget(data.vehicleId);
      const targetReached = targetAmount ? data.amount >= targetAmount : false;

      // Create remittance
      const remittance = await this.prisma.remittance.create({
        data: {
          tenantId: this.tenantId!,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          amount: data.amount,
          targetAmount,
          targetReached,
          date: data.date,
          proofOfPayment: data.proofOfPayment,
          notes: data.notes,
          status: 'PENDING',
        },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              make: true,
              model: true,
            },
          },
        },
      });

      dbLogger.info(
        {
          remittanceId: remittance.id,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          amount: data.amount,
          targetReached,
          tenantId: this.tenantId,
          userId,
        },
        'Remittance created'
      );

      return remittance;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error creating remittance');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find remittance by ID
   */
  async findById(id: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const remittance = await this.prisma.remittance.findUnique({
        where: { id },
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              make: true,
              model: true,
              type: true,
              paymentModel: true,
              paymentConfig: true,
            },
          },
        },
      });

      if (!remittance) {
        throw new NotFoundError('Remittance');
      }

      return remittance;
    } catch (error) {
      dbLogger.error({ err: error, remittanceId: id }, 'Error finding remittance');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find all remittances with filters
   */
  async findAll(filters: RemittanceFilters = {}) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const {
        driverId,
        vehicleId,
        status,
        targetReached,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = filters;

      const where: any = {};

      if (driverId) where.driverId = driverId;
      if (vehicleId) where.vehicleId = vehicleId;
      if (status) where.status = status;
      if (targetReached !== undefined) where.targetReached = targetReached;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      const [remittances, total] = await Promise.all([
        this.prisma.remittance.findMany({
          where,
          include: {
            driver: {
              select: {
                id: true,
                fullName: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                registrationNumber: true,
                make: true,
                model: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            date: 'desc',
          },
        }),
        this.prisma.remittance.count({ where }),
      ]);

      return {
        remittances,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, filters }, 'Error finding remittances');
      throw handlePrismaError(error);
    }
  }

  /**
   * Update remittance (only pending remittances can be updated)
   */
  async update(id: string, data: UpdateRemittanceDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if remittance exists and is pending
      const existing = await this.findById(id);
      if (existing.status !== 'PENDING') {
        throw new ValidationError('Only pending remittances can be updated');
      }

      // Recalculate target if amount changed
      let updateData: any = { ...data };
      if (data.amount) {
        const targetAmount = existing.targetAmount;
        updateData.targetReached = targetAmount ? data.amount >= targetAmount : false;
      }

      // Update remittance
      const remittance = await this.prisma.remittance.update({
        where: { id },
        data: updateData,
        include: {
          driver: true,
          vehicle: true,
        },
      });

      dbLogger.info(
        {
          remittanceId: remittance.id,
          tenantId: this.tenantId,
          userId,
        },
        'Remittance updated'
      );

      return remittance;
    } catch (error) {
      dbLogger.error({ err: error, remittanceId: id }, 'Error updating remittance');
      throw handlePrismaError(error);
    }
  }

  /**
   * Approve remittance
   */
  async approve(data: ApproveRemittanceDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if remittance exists and is pending
      const existing = await this.findById(data.remittanceId);
      if (existing.status !== 'PENDING') {
        throw new ValidationError('Only pending remittances can be approved');
      }

      // Approve remittance and create income record
      const [remittance] = await this.prisma.$transaction([
        this.prisma.remittance.update({
          where: { id: data.remittanceId },
          data: {
            status: 'APPROVED',
            approvedBy: data.approvedBy,
            approvedAt: new Date(),
          },
          include: {
            driver: true,
            vehicle: true,
          },
        }),
        // Create income record
        this.prisma.income.create({
          data: {
            tenantId: this.tenantId!,
            vehicleId: existing.vehicleId,
            source: 'REMITTANCE',
            amount: existing.amount,
            date: existing.date,
            description: `Remittance from ${existing.driver.fullName} for ${existing.vehicle.registrationNumber}`,
          },
        }),
      ]);

      dbLogger.info(
        {
          remittanceId: remittance.id,
          approvedBy: data.approvedBy,
          amount: remittance.amount,
          tenantId: this.tenantId,
          userId,
        },
        'Remittance approved'
      );

      return remittance;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error approving remittance');
      throw handlePrismaError(error);
    }
  }

  /**
   * Reject remittance
   */
  async reject(data: RejectRemittanceDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if remittance exists and is pending
      const existing = await this.findById(data.remittanceId);
      if (existing.status !== 'PENDING') {
        throw new ValidationError('Only pending remittances can be rejected');
      }

      // Reject remittance
      const remittance = await this.prisma.remittance.update({
        where: { id: data.remittanceId },
        data: {
          status: 'REJECTED',
          notes: data.notes,
        },
        include: {
          driver: true,
          vehicle: true,
        },
      });

      dbLogger.info(
        {
          remittanceId: remittance.id,
          tenantId: this.tenantId,
          userId,
        },
        'Remittance rejected'
      );

      return remittance;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error rejecting remittance');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get remittance statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = startDate;
        if (endDate) dateFilter.date.lte = endDate;
      }

      const [
        total,
        pending,
        approved,
        rejected,
        targetsReached,
        totalApprovedAmount,
      ] = await Promise.all([
        this.prisma.remittance.count({ where: dateFilter }),
        this.prisma.remittance.count({ where: { ...dateFilter, status: 'PENDING' } }),
        this.prisma.remittance.count({ where: { ...dateFilter, status: 'APPROVED' } }),
        this.prisma.remittance.count({ where: { ...dateFilter, status: 'REJECTED' } }),
        this.prisma.remittance.count({
          where: { ...dateFilter, targetReached: true, status: 'APPROVED' },
        }),
        this.prisma.remittance.aggregate({
          where: { ...dateFilter, status: 'APPROVED' },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        total,
        pending,
        approved,
        rejected,
        targetsReached,
        totalAmount: totalApprovedAmount._sum.amount || 0,
        targetComplianceRate: approved > 0 ? (targetsReached / approved) * 100 : 0,
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting remittance statistics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get remittances by driver with performance metrics
   */
  async getByDriver(driverId: string, startDate: Date, endDate: Date) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const remittances = await this.prisma.remittance.findMany({
        where: {
          driverId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          vehicle: {
            select: {
              registrationNumber: true,
              make: true,
              model: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      const approved = remittances.filter(r => r.status === 'APPROVED');
      const totalAmount = approved.reduce((sum, r) => sum + Number(r.amount), 0);
      const targetsReached = approved.filter(r => r.targetReached).length;

      return {
        remittances,
        summary: {
          total: remittances.length,
          approved: approved.length,
          pending: remittances.filter(r => r.status === 'PENDING').length,
          rejected: remittances.filter(r => r.status === 'REJECTED').length,
          totalAmount,
          targetsReached,
          targetComplianceRate:
            approved.length > 0 ? (targetsReached / approved.length) * 100 : 0,
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, driverId }, 'Error getting driver remittances');
      throw handlePrismaError(error);
    }
  }
}

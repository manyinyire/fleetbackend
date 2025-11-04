/**
 * Driver Service Layer
 *
 * Business logic for driver management including:
 * - CRUD operations
 * - Contract management
 * - Payment tracking
 * - Performance analytics
 */

import { PrismaClient, DriverStatus, ContractStatus } from '@prisma/client';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { dbLogger } from '@/lib/logger';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  handlePrismaError,
} from '@/lib/errors';

export interface CreateDriverDTO {
  fullName: string;
  nationalId: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  homeAddress: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  hasDefensiveLicense?: boolean;
  defensiveLicenseNumber?: string;
  defensiveLicenseExpiry?: Date;
  status?: DriverStatus;
}

export interface UpdateDriverDTO extends Partial<CreateDriverDTO> {
  debtBalance?: number;
}

export interface DriverFilters {
  status?: DriverStatus;
  search?: string;
  hasDefensiveLicense?: boolean;
  page?: number;
  limit?: number;
}

export interface AssignVehicleDTO {
  driverId: string;
  vehicleId: string;
  startDate: Date;
  isPrimary?: boolean;
}

export class DriverService {
  private prisma: PrismaClient;
  private tenantId: string | null;

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
    this.prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;
  }

  /**
   * Create a new driver
   */
  async create(data: CreateDriverDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check for duplicate national ID
      const existing = await this.prisma.driver.findFirst({
        where: {
          nationalId: data.nationalId,
        },
      });

      if (existing) {
        throw new ConflictError(
          `A driver with national ID "${data.nationalId}" already exists`
        );
      }

      // Validate defensive license requirements for OMNIBUS
      if (data.hasDefensiveLicense) {
        if (!data.defensiveLicenseNumber || !data.defensiveLicenseExpiry) {
          throw new ValidationError(
            'Defensive license number and expiry date are required'
          );
        }
      }

      // Create driver
      const driver = await this.prisma.driver.create({
        data: {
          tenantId: this.tenantId!,
          fullName: data.fullName,
          nationalId: data.nationalId,
          licenseNumber: data.licenseNumber,
          phone: data.phone,
          email: data.email,
          homeAddress: data.homeAddress,
          nextOfKin: data.nextOfKin,
          nextOfKinPhone: data.nextOfKinPhone,
          hasDefensiveLicense: data.hasDefensiveLicense || false,
          defensiveLicenseNumber: data.defensiveLicenseNumber,
          defensiveLicenseExpiry: data.defensiveLicenseExpiry,
          status: data.status || 'ACTIVE',
          debtBalance: 0,
        },
      });

      dbLogger.info(
        {
          driverId: driver.id,
          tenantId: this.tenantId,
          userId,
        },
        'Driver created'
      );

      return driver;
    } catch (error) {
      dbLogger.error({ err: error, tenantId: this.tenantId }, 'Error creating driver');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find driver by ID with related data
   */
  async findById(id: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const driver = await this.prisma.driver.findUnique({
        where: { id },
        include: {
          vehicles: {
            include: {
              vehicle: {
                select: {
                  id: true,
                  registrationNumber: true,
                  make: true,
                  model: true,
                  type: true,
                  status: true,
                },
              },
            },
            where: {
              endDate: null, // Active assignments only
            },
          },
          remittances: {
            take: 10,
            orderBy: {
              date: 'desc',
            },
            select: {
              id: true,
              amount: true,
              targetAmount: true,
              targetReached: true,
              date: true,
              status: true,
              vehicle: {
                select: {
                  registrationNumber: true,
                },
              },
            },
          },
          contracts: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
        },
      });

      if (!driver) {
        throw new NotFoundError('Driver');
      }

      return driver;
    } catch (error) {
      dbLogger.error({ err: error, driverId: id }, 'Error finding driver');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find all drivers with filters and pagination
   */
  async findAll(filters: DriverFilters = {}) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const { status, search, hasDefensiveLicense, page = 1, limit = 10 } = filters;

      const where: any = {};

      if (status) where.status = status;
      if (hasDefensiveLicense !== undefined) where.hasDefensiveLicense = hasDefensiveLicense;
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { nationalId: { contains: search, mode: 'insensitive' } },
          { licenseNumber: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [drivers, total] = await Promise.all([
        this.prisma.driver.findMany({
          where,
          include: {
            vehicles: {
              where: {
                endDate: null,
              },
              include: {
                vehicle: {
                  select: {
                    id: true,
                    registrationNumber: true,
                    make: true,
                    model: true,
                  },
                },
              },
            },
            _count: {
              select: {
                remittances: true,
                contracts: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.driver.count({ where }),
      ]);

      return {
        drivers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, filters }, 'Error finding drivers');
      throw handlePrismaError(error);
    }
  }

  /**
   * Update driver
   */
  async update(id: string, data: UpdateDriverDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if driver exists
      await this.findById(id);

      // Update driver
      const driver = await this.prisma.driver.update({
        where: { id },
        data,
      });

      dbLogger.info(
        {
          driverId: driver.id,
          tenantId: this.tenantId,
          userId,
        },
        'Driver updated'
      );

      return driver;
    } catch (error) {
      dbLogger.error({ err: error, driverId: id }, 'Error updating driver');
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete driver (soft delete by setting status to TERMINATED)
   */
  async delete(id: string, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if driver exists
      await this.findById(id);

      // Soft delete by updating status
      await this.prisma.driver.update({
        where: { id },
        data: {
          status: 'TERMINATED',
        },
      });

      dbLogger.info(
        {
          driverId: id,
          tenantId: this.tenantId,
          userId,
        },
        'Driver terminated'
      );

      return { success: true };
    } catch (error) {
      dbLogger.error({ err: error, driverId: id }, 'Error deleting driver');
      throw handlePrismaError(error);
    }
  }

  /**
   * Assign vehicle to driver
   */
  async assignVehicle(data: AssignVehicleDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Verify driver exists
      await this.findById(data.driverId);

      // Verify vehicle exists
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle');
      }

      // If this is a primary assignment, unset other primary assignments for this driver
      if (data.isPrimary) {
        await this.prisma.driverVehicleAssignment.updateMany({
          where: {
            driverId: data.driverId,
            isPrimary: true,
            endDate: null,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      // Create assignment
      const assignment = await this.prisma.driverVehicleAssignment.create({
        data: {
          tenantId: this.tenantId!,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          startDate: data.startDate,
          isPrimary: data.isPrimary || false,
        },
        include: {
          driver: true,
          vehicle: true,
        },
      });

      dbLogger.info(
        {
          assignmentId: assignment.id,
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          tenantId: this.tenantId,
          userId,
        },
        'Vehicle assigned to driver'
      );

      return assignment;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error assigning vehicle');
      throw handlePrismaError(error);
    }
  }

  /**
   * End vehicle assignment
   */
  async endAssignment(assignmentId: string, endDate: Date, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const assignment = await this.prisma.driverVehicleAssignment.update({
        where: { id: assignmentId },
        data: { endDate },
      });

      dbLogger.info(
        {
          assignmentId,
          tenantId: this.tenantId,
          userId,
        },
        'Vehicle assignment ended'
      );

      return assignment;
    } catch (error) {
      dbLogger.error({ err: error, assignmentId }, 'Error ending assignment');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get driver statistics
   */
  async getStatistics() {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const [total, activeCount, inactiveCount, terminatedCount] = await Promise.all([
        this.prisma.driver.count(),
        this.prisma.driver.count({ where: { status: 'ACTIVE' } }),
        this.prisma.driver.count({ where: { status: 'INACTIVE' } }),
        this.prisma.driver.count({ where: { status: 'TERMINATED' } }),
      ]);

      return {
        total,
        active: activeCount,
        inactive: inactiveCount,
        terminated: terminatedCount,
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting driver statistics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get driver performance metrics
   */
  async getPerformance(driverId: string, startDate: Date, endDate: Date) {
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
          status: 'APPROVED',
        },
        select: {
          amount: true,
          targetAmount: true,
          targetReached: true,
          date: true,
        },
      });

      const totalRemitted = remittances.reduce((sum, r) => sum + Number(r.amount), 0);
      const targetsReached = remittances.filter(r => r.targetReached).length;
      const totalRemittances = remittances.length;

      return {
        totalRemitted,
        totalRemittances,
        targetsReached,
        targetComplianceRate:
          totalRemittances > 0 ? (targetsReached / totalRemittances) * 100 : 0,
        averageRemittance: totalRemittances > 0 ? totalRemitted / totalRemittances : 0,
      };
    } catch (error) {
      dbLogger.error({ err: error, driverId }, 'Error getting driver performance');
      throw handlePrismaError(error);
    }
  }
}

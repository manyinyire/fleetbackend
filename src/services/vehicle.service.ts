/**
 * Vehicle Service Layer
 *
 * Business logic for vehicle management.
 * Separates business logic from API routes and server actions.
 */

import { PrismaClient, VehicleType, VehicleStatus, PaymentModel } from '@prisma/client';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { dbLogger } from '@/lib/logger';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  handlePrismaError,
} from '@/lib/errors';

export interface CreateVehicleDTO {
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  initialCost: number;
  currentMileage?: number;
  status?: VehicleStatus;
  paymentModel: PaymentModel;
  paymentConfig: any;
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> {}

export interface VehicleFilters {
  type?: VehicleType;
  status?: VehicleStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export class VehicleService {
  private prisma: PrismaClient;
  private tenantId: string | null;

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
    this.prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;
  }

  /**
   * Create a new vehicle
   */
  async create(data: CreateVehicleDTO, userId: string) {
    try {
      // Set RLS context
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check for duplicate registration number
      const existing = await this.prisma.vehicle.findFirst({
        where: {
          registrationNumber: data.registrationNumber,
        },
      });

      if (existing) {
        throw new ConflictError(
          `A vehicle with registration number "${data.registrationNumber}" already exists`
        );
      }

      // Create vehicle
      const vehicle = await this.prisma.vehicle.create({
        data: {
          tenantId: this.tenantId!,
          registrationNumber: data.registrationNumber,
          make: data.make,
          model: data.model,
          year: data.year,
          type: data.type,
          initialCost: data.initialCost,
          currentMileage: data.currentMileage || 0,
          status: data.status || 'ACTIVE',
          paymentModel: data.paymentModel,
          paymentConfig: data.paymentConfig,
        },
      });

      dbLogger.info(
        {
          vehicleId: vehicle.id,
          tenantId: this.tenantId,
          userId,
        },
        'Vehicle created'
      );

      return vehicle;
    } catch (error) {
      dbLogger.error({ err: error, tenantId: this.tenantId }, 'Error creating vehicle');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find vehicle by ID
   */
  async findById(id: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id },
        include: {
          drivers: {
            include: {
              driver: true,
            },
            where: {
              endDate: null, // Active assignments
            },
          },
          remittances: {
            take: 10,
            orderBy: {
              date: 'desc',
            },
          },
          maintenanceRecords: {
            take: 5,
            orderBy: {
              date: 'desc',
            },
          },
        },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle');
      }

      return vehicle;
    } catch (error) {
      dbLogger.error({ err: error, vehicleId: id }, 'Error finding vehicle');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find all vehicles with filters
   */
  async findAll(filters: VehicleFilters = {}) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const { type, status, search, page = 1, limit = 10 } = filters;

      const where: any = {};

      if (type) where.type = type;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [vehicles, total] = await Promise.all([
        this.prisma.vehicle.findMany({
          where,
          include: {
            drivers: {
              where: {
                endDate: null,
              },
              include: {
                driver: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.vehicle.count({ where }),
      ]);

      return {
        vehicles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, filters }, 'Error finding vehicles');
      throw handlePrismaError(error);
    }
  }

  /**
   * Update vehicle
   */
  async update(id: string, data: UpdateVehicleDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if vehicle exists
      await this.findById(id);

      // Update vehicle
      const vehicle = await this.prisma.vehicle.update({
        where: { id },
        data,
      });

      dbLogger.info(
        {
          vehicleId: vehicle.id,
          tenantId: this.tenantId,
          userId,
        },
        'Vehicle updated'
      );

      return vehicle;
    } catch (error) {
      dbLogger.error({ err: error, vehicleId: id }, 'Error updating vehicle');
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete vehicle
   */
  async delete(id: string, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if vehicle exists
      await this.findById(id);

      // Delete vehicle (will cascade to related records)
      await this.prisma.vehicle.delete({
        where: { id },
      });

      dbLogger.info(
        {
          vehicleId: id,
          tenantId: this.tenantId,
          userId,
        },
        'Vehicle deleted'
      );

      return { success: true };
    } catch (error) {
      dbLogger.error({ err: error, vehicleId: id }, 'Error deleting vehicle');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get vehicle statistics
   */
  async getStatistics() {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const [total, activeCount, maintenanceCount, decommissionedCount] = await Promise.all([
        this.prisma.vehicle.count(),
        this.prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
        this.prisma.vehicle.count({ where: { status: 'UNDER_MAINTENANCE' } }),
        this.prisma.vehicle.count({ where: { status: 'DECOMMISSIONED' } }),
      ]);

      return {
        total,
        active: activeCount,
        underMaintenance: maintenanceCount,
        decommissioned: decommissionedCount,
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting vehicle statistics');
      throw handlePrismaError(error);
    }
  }
}

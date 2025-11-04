/**
 * Maintenance Service Layer
 *
 * Business logic for vehicle maintenance management including:
 * - Maintenance record tracking
 * - Cost analysis
 * - Scheduling and reminders
 * - Maintenance history
 */

import { PrismaClient, MaintenanceType, VehicleStatus } from '@prisma/client';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { dbLogger } from '@/lib/logger';
import {
  NotFoundError,
  ValidationError,
  handlePrismaError,
} from '@/lib/errors';

export interface CreateMaintenanceDTO {
  vehicleId: string;
  date: Date;
  mileage: number;
  type: MaintenanceType;
  description: string;
  cost: number;
  provider: string;
  invoice?: string;
}

export interface UpdateMaintenanceDTO extends Partial<CreateMaintenanceDTO> {}

export interface MaintenanceFilters {
  vehicleId?: string;
  type?: MaintenanceType;
  startDate?: Date;
  endDate?: Date;
  minCost?: number;
  maxCost?: number;
  page?: number;
  limit?: number;
}

export interface MaintenanceSchedule {
  vehicleId: string;
  lastServiceDate?: Date;
  lastServiceMileage?: number;
  currentMileage: number;
  nextServiceDue: Date | null;
  nextServiceMileage: number | null;
  isOverdue: boolean;
}

export class MaintenanceService {
  private prisma: PrismaClient;
  private tenantId: string | null;

  // Service intervals
  private readonly SERVICE_INTERVAL_KM = 10000; // km
  private readonly SERVICE_INTERVAL_DAYS = 180; // days

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
    this.prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;
  }

  /**
   * Create a new maintenance record
   */
  async create(data: CreateMaintenanceDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Validate cost
      if (data.cost < 0) {
        throw new ValidationError('Maintenance cost cannot be negative');
      }

      // Verify vehicle exists
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundError('Vehicle');
      }

      // Validate mileage
      if (data.mileage < vehicle.currentMileage) {
        throw new ValidationError(
          `Maintenance mileage (${data.mileage} km) cannot be less than vehicle current mileage (${vehicle.currentMileage} km)`
        );
      }

      // Create maintenance record and expense in a transaction
      const [maintenance] = await this.prisma.$transaction([
        this.prisma.maintenanceRecord.create({
          data: {
            tenantId: this.tenantId!,
            vehicleId: data.vehicleId,
            date: data.date,
            mileage: data.mileage,
            type: data.type,
            description: data.description,
            cost: data.cost,
            provider: data.provider,
            invoice: data.invoice,
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
        }),
        // Create corresponding expense
        this.prisma.expense.create({
          data: {
            tenantId: this.tenantId!,
            vehicleId: data.vehicleId,
            category: 'MAINTENANCE',
            amount: data.cost,
            date: data.date,
            description: `${data.type}: ${data.description}`,
            receipt: data.invoice,
            status: 'APPROVED',
            approvedBy: userId,
            approvedAt: new Date(),
          },
        }),
        // Update vehicle mileage if this is more recent
        this.prisma.vehicle.update({
          where: { id: data.vehicleId },
          data: {
            currentMileage: Math.max(vehicle.currentMileage, data.mileage),
          },
        }),
      ]);

      dbLogger.info(
        {
          maintenanceId: maintenance.id,
          vehicleId: data.vehicleId,
          type: data.type,
          cost: data.cost,
          tenantId: this.tenantId,
          userId,
        },
        'Maintenance record created'
      );

      return maintenance;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error creating maintenance record');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find maintenance record by ID
   */
  async findById(id: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const maintenance = await this.prisma.maintenanceRecord.findUnique({
        where: { id },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              make: true,
              model: true,
              year: true,
              type: true,
              currentMileage: true,
            },
          },
        },
      });

      if (!maintenance) {
        throw new NotFoundError('Maintenance record');
      }

      return maintenance;
    } catch (error) {
      dbLogger.error({ err: error, maintenanceId: id }, 'Error finding maintenance record');
      throw handlePrismaError(error);
    }
  }

  /**
   * Find all maintenance records with filters
   */
  async findAll(filters: MaintenanceFilters = {}) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const {
        vehicleId,
        type,
        startDate,
        endDate,
        minCost,
        maxCost,
        page = 1,
        limit = 10,
      } = filters;

      const where: any = {};

      if (vehicleId) where.vehicleId = vehicleId;
      if (type) where.type = type;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }
      if (minCost || maxCost) {
        where.cost = {};
        if (minCost) where.cost.gte = minCost;
        if (maxCost) where.cost.lte = maxCost;
      }

      const [records, total] = await Promise.all([
        this.prisma.maintenanceRecord.findMany({
          where,
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
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            date: 'desc',
          },
        }),
        this.prisma.maintenanceRecord.count({ where }),
      ]);

      return {
        records,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, filters }, 'Error finding maintenance records');
      throw handlePrismaError(error);
    }
  }

  /**
   * Update maintenance record
   */
  async update(id: string, data: UpdateMaintenanceDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if maintenance record exists
      await this.findById(id);

      // Validate cost if provided
      if (data.cost !== undefined && data.cost < 0) {
        throw new ValidationError('Maintenance cost cannot be negative');
      }

      // Update maintenance record
      const maintenance = await this.prisma.maintenanceRecord.update({
        where: { id },
        data,
        include: {
          vehicle: true,
        },
      });

      dbLogger.info(
        {
          maintenanceId: maintenance.id,
          tenantId: this.tenantId,
          userId,
        },
        'Maintenance record updated'
      );

      return maintenance;
    } catch (error) {
      dbLogger.error({ err: error, maintenanceId: id }, 'Error updating maintenance record');
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete maintenance record
   */
  async delete(id: string, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      // Check if maintenance record exists
      await this.findById(id);

      // Delete maintenance record
      await this.prisma.maintenanceRecord.delete({
        where: { id },
      });

      dbLogger.info(
        {
          maintenanceId: id,
          tenantId: this.tenantId,
          userId,
        },
        'Maintenance record deleted'
      );

      return { success: true };
    } catch (error) {
      dbLogger.error({ err: error, maintenanceId: id }, 'Error deleting maintenance record');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get maintenance statistics
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

      const [total, totalCost, byType] = await Promise.all([
        this.prisma.maintenanceRecord.count({ where: dateFilter }),
        this.prisma.maintenanceRecord.aggregate({
          where: dateFilter,
          _sum: {
            cost: true,
          },
        }),
        this.prisma.maintenanceRecord.groupBy({
          by: ['type'],
          where: dateFilter,
          _count: {
            type: true,
          },
          _sum: {
            cost: true,
          },
        }),
      ]);

      return {
        total,
        totalCost: totalCost._sum.cost || 0,
        averageCost: total > 0 ? (totalCost._sum.cost || 0) / total : 0,
        byType: byType.map(item => ({
          type: item.type,
          count: item._count.type,
          totalCost: item._sum.cost || 0,
        })),
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting maintenance statistics');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get maintenance history for a vehicle
   */
  async getVehicleHistory(vehicleId: string, limit: number = 10) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const records = await this.prisma.maintenanceRecord.findMany({
        where: { vehicleId },
        orderBy: {
          date: 'desc',
        },
        take: limit,
      });

      const totalCost = records.reduce((sum, r) => sum + Number(r.cost), 0);

      return {
        records,
        summary: {
          totalRecords: records.length,
          totalCost,
          averageCost: records.length > 0 ? totalCost / records.length : 0,
          lastMaintenance: records[0]?.date || null,
          lastMileage: records[0]?.mileage || null,
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, vehicleId }, 'Error getting vehicle maintenance history');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get maintenance schedule for all vehicles
   */
  async getMaintenanceSchedule(): Promise<MaintenanceSchedule[]> {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          registrationNumber: true,
          currentMileage: true,
        },
      });

      const schedules = await Promise.all(
        vehicles.map(async vehicle => {
          // Get last service record
          const lastService = await this.prisma.maintenanceRecord.findFirst({
            where: {
              vehicleId: vehicle.id,
              type: 'ROUTINE_SERVICE',
            },
            orderBy: {
              date: 'desc',
            },
          });

          // Calculate next service due
          let nextServiceDue: Date | null = null;
          let nextServiceMileage: number | null = null;
          let isOverdue = false;

          if (lastService) {
            // Next service by date
            const nextServiceDate = new Date(lastService.date);
            nextServiceDate.setDate(nextServiceDate.getDate() + this.SERVICE_INTERVAL_DAYS);
            nextServiceDue = nextServiceDate;

            // Next service by mileage
            nextServiceMileage = lastService.mileage + this.SERVICE_INTERVAL_KM;

            // Check if overdue
            const now = new Date();
            isOverdue =
              now > nextServiceDate || vehicle.currentMileage >= nextServiceMileage;
          }

          return {
            vehicleId: vehicle.id,
            registrationNumber: vehicle.registrationNumber,
            lastServiceDate: lastService?.date,
            lastServiceMileage: lastService?.mileage,
            currentMileage: vehicle.currentMileage,
            nextServiceDue,
            nextServiceMileage,
            isOverdue,
          } as MaintenanceSchedule;
        })
      );

      return schedules;
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting maintenance schedule');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get vehicles due for maintenance
   */
  async getVehiclesDueForMaintenance(): Promise<MaintenanceSchedule[]> {
    const schedules = await this.getMaintenanceSchedule();
    return schedules.filter(s => s.isOverdue);
  }

  /**
   * Get maintenance cost by vehicle
   */
  async getCostByVehicle(startDate?: Date, endDate?: Date) {
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

      const costsByVehicle = await this.prisma.maintenanceRecord.groupBy({
        by: ['vehicleId'],
        where: dateFilter,
        _count: {
          vehicleId: true,
        },
        _sum: {
          cost: true,
        },
      });

      // Get vehicle details
      const vehicleIds = costsByVehicle.map(c => c.vehicleId);
      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          id: {
            in: vehicleIds,
          },
        },
        select: {
          id: true,
          registrationNumber: true,
          make: true,
          model: true,
        },
      });

      const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

      return costsByVehicle.map(item => {
        const vehicle = vehicleMap.get(item.vehicleId);
        return {
          vehicleId: item.vehicleId,
          vehicle,
          maintenanceCount: item._count.vehicleId,
          totalCost: item._sum.cost || 0,
        };
      });
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting maintenance cost by vehicle');
      throw handlePrismaError(error);
    }
  }
}

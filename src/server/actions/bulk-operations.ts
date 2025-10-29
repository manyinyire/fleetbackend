'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { sendBulkDriverSMS } from './notifications';
import { revalidatePath } from 'next/cache';

export async function bulkDeleteVehicles(vehicleIds: string[]) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  try {
    const results = [];
    
    for (const vehicleId of vehicleIds) {
      try {
        // Check if vehicle has active assignments
        const activeAssignments = await prisma.driverVehicleAssignment.findFirst({
          where: {
            vehicleId,
            endDate: null
          }
        });

        if (activeAssignments) {
          results.push({
            id: vehicleId,
            success: false,
            error: 'Vehicle has active driver assignments'
          });
          continue;
        }

        // Delete vehicle
        await prisma.vehicle.delete({
          where: { id: vehicleId }
        });

        // Log the deletion
        await prisma.auditLog.create({
          data: {
            tenantId,
            userId: user.id,
            action: 'BULK_DELETE',
            entityType: 'Vehicle',
            entityId: vehicleId,
            details: {
              operation: 'bulk_delete_vehicles',
              vehicleId
            }
          }
        });

        results.push({
          id: vehicleId,
          success: true
        });
      } catch (error) {
        results.push({
          id: vehicleId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    revalidatePath('/vehicles');
    return { success: true, results };
  } catch (error) {
    console.error('Bulk delete vehicles error:', error);
    throw error;
  }
}

export async function bulkDeleteDrivers(driverIds: string[]) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  try {
    const results = [];
    
    for (const driverId of driverIds) {
      try {
        // Check if driver has active assignments
        const activeAssignments = await prisma.driverVehicleAssignment.findFirst({
          where: {
            driverId,
            endDate: null
          }
        });

        if (activeAssignments) {
          results.push({
            id: driverId,
            success: false,
            error: 'Driver has active vehicle assignments'
          });
          continue;
        }

        // Delete driver
        await prisma.driver.delete({
          where: { id: driverId }
        });

        // Log the deletion
        await prisma.auditLog.create({
          data: {
            tenantId,
            userId: user.id,
            action: 'BULK_DELETE',
            entityType: 'Driver',
            entityId: driverId,
            details: {
              operation: 'bulk_delete_drivers',
              driverId
            }
          }
        });

        results.push({
          id: driverId,
          success: true
        });
      } catch (error) {
        results.push({
          id: driverId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    revalidatePath('/drivers');
    return { success: true, results };
  } catch (error) {
    console.error('Bulk delete drivers error:', error);
    throw error;
  }
}

export async function bulkUpdateVehicleStatus(vehicleIds: string[], status: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  try {
    const results = [];
    
    for (const vehicleId of vehicleIds) {
      try {
        // Update vehicle status
        await prisma.vehicle.update({
          where: { id: vehicleId },
          data: { status }
        });

        // Log the update
        await prisma.auditLog.create({
          data: {
            tenantId,
            userId: user.id,
            action: 'BULK_UPDATE',
            entityType: 'Vehicle',
            entityId: vehicleId,
            details: {
              operation: 'bulk_update_vehicle_status',
              vehicleId,
              newStatus: status
            }
          }
        });

        results.push({
          id: vehicleId,
          success: true
        });
      } catch (error) {
        results.push({
          id: vehicleId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    revalidatePath('/vehicles');
    return { success: true, results };
  } catch (error) {
    console.error('Bulk update vehicle status error:', error);
    throw error;
  }
}

export async function bulkUpdateDriverStatus(driverIds: string[], status: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  try {
    const results = [];
    
    for (const driverId of driverIds) {
      try {
        // Update driver status
        await prisma.driver.update({
          where: { id: driverId },
          data: { status }
        });

        // Log the update
        await prisma.auditLog.create({
          data: {
            tenantId,
            userId: user.id,
            action: 'BULK_UPDATE',
            entityType: 'Driver',
            entityId: driverId,
            details: {
              operation: 'bulk_update_driver_status',
              driverId,
              newStatus: status
            }
          }
        });

        results.push({
          id: driverId,
          success: true
        });
      } catch (error) {
        results.push({
          id: driverId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    revalidatePath('/drivers');
    return { success: true, results };
  } catch (error) {
    console.error('Bulk update driver status error:', error);
    throw error;
  }
}

export async function bulkSendSMS(driverIds: string[], template: string, message?: string) {
  const { user, tenantId } = await requireTenant();
  
  try {
    const result = await sendBulkDriverSMS(driverIds, template as any, message);
    return result;
  } catch (error) {
    console.error('Bulk SMS error:', error);
    throw error;
  }
}

export async function bulkExportData(entityType: string, entityIds: string[]) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  try {
    let data: any[] = [];
    
    switch (entityType) {
      case 'vehicles':
        data = await prisma.vehicle.findMany({
          where: { id: { in: entityIds } },
          include: {
            drivers: {
              include: {
                driver: true
              }
            }
          }
        });
        break;
      case 'drivers':
        data = await prisma.driver.findMany({
          where: { id: { in: entityIds } },
          include: {
            vehicles: {
              include: {
                vehicle: true
              }
            }
          }
        });
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Log the export
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'BULK_EXPORT',
        entityType: entityType.toUpperCase(),
        entityId: entityIds.join(','),
        details: {
          operation: 'bulk_export_data',
          entityType,
          count: entityIds.length
        }
      }
    });

    return { success: true, data };
  } catch (error) {
    console.error('Bulk export error:', error);
    throw error;
  }
}
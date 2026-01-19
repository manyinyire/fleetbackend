'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

export async function sendDriverSMS(driverId: string, template: string, customMessage?: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  try {
    // Get driver information
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicles: {
          include: {
            vehicle: true
          }
        }
      }
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    if (!driver.phone) {
      throw new Error('Driver phone number not available');
    }

    // SMS functionality temporarily disabled
    // TODO: Implement SMS provider integration
    
    // Log the notification attempt
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'SMS_DISABLED',
        entityType: 'Driver',
        entityId: driverId,
        details: {
          template,
          message: customMessage || 'SMS functionality disabled',
          phone: driver.phone,
          note: 'SMS provider not configured'
        }
      }
    });

    revalidatePath('/drivers');
    return { success: false, error: 'SMS functionality is currently disabled' };
  } catch (error) {
    console.error('SMS notification error:', error);
    throw error;
  }
}

export async function sendBulkDriverSMS(driverIds: string[], template: string, customMessage?: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  
  // Get scoped Prisma client
  const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

  try {
    // Get drivers information
    const drivers = await prisma.driver.findMany({
      where: { 
        id: { in: driverIds },
        phone: { not: null }
      }
    });

    if (drivers.length === 0) {
      throw new Error('No drivers with phone numbers found');
    }

    const results = [];
    
    for (const driver of drivers) {
      // SMS functionality temporarily disabled
      results.push({
        driverId: driver.id,
        driverName: driver.fullName,
        success: false,
        error: 'SMS functionality is currently disabled'
      });

      // Log the notification attempt
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          action: 'BULK_SMS_DISABLED',
          entityType: 'Driver',
          entityId: driver.id,
          details: {
            template,
            message: customMessage || 'SMS functionality disabled',
            phone: driver.phone,
            note: 'SMS provider not configured'
          }
        }
      });
    }

    revalidatePath('/drivers');
    return { success: false, results, error: 'SMS functionality is currently disabled' };
  } catch (error) {
    console.error('Bulk SMS notification error:', error);
    throw error;
  }
}
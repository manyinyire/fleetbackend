'use server';

import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { sendSMS, SMSTemplates } from '@/lib/sms';
import { revalidatePath } from 'next/cache';

export async function sendDriverSMS(driverId: string, template: keyof typeof SMSTemplates, customMessage?: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

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

    // Get tenant settings for company name
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });

    const companyName = settings?.companyName || 'Azaire Fleet Manager';

    // Generate message based on template
    let message: string;
    
    switch (template) {
      case 'welcome':
        message = SMSTemplates.welcome(driver.fullName, companyName);
        break;
      case 'remittanceReceived':
        message = SMSTemplates.remittanceReceived(driver.fullName, 0, 'your vehicle'); // Amount and vehicle would be passed as parameters
        break;
      case 'maintenanceReminder':
        message = SMSTemplates.maintenanceReminder(driver.fullName, 'your vehicle', 'service'); // Vehicle and service type would be passed as parameters
        break;
      case 'paymentReminder':
        message = SMSTemplates.paymentReminder(driver.fullName, 0, 'soon'); // Amount and due date would be passed as parameters
        break;
      case 'contractExpiry':
        message = SMSTemplates.contractExpiry(driver.fullName, 'soon'); // Expiry date would be passed as parameters
        break;
      case 'systemAlert':
        message = SMSTemplates.systemAlert(customMessage || 'System notification');
        break;
      case 'custom':
        message = customMessage || 'Custom message';
        break;
      default:
        message = customMessage || 'Notification from Azaire';
    }

    // Send SMS
    const result = await sendSMS({
      to: driver.phone,
      message,
      from: companyName
    });

    if (result.success) {
      // Log the notification
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          action: 'SMS_SENT',
          entityType: 'Driver',
          entityId: driverId,
          details: {
            template,
            message,
            phone: driver.phone,
            messageId: result.messageId
          }
        }
      });

      revalidatePath('/drivers');
      return { success: true, messageId: result.messageId };
    } else {
      throw new Error(result.error || 'Failed to send SMS');
    }
  } catch (error) {
    console.error('SMS notification error:', error);
    throw error;
  }
}

export async function sendBulkDriverSMS(driverIds: string[], template: keyof typeof SMSTemplates, customMessage?: string) {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

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

    // Get tenant settings for company name
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });

    const companyName = settings?.companyName || 'Azaire Fleet Manager';

    const results = [];
    
    for (const driver of drivers) {
      try {
        // Generate message based on template
        let message: string;
        
        switch (template) {
          case 'welcome':
            message = SMSTemplates.welcome(driver.fullName, companyName);
            break;
          case 'systemAlert':
            message = SMSTemplates.systemAlert(customMessage || 'System notification');
            break;
          case 'custom':
            message = customMessage || 'Custom message';
            break;
          default:
            message = customMessage || 'Notification from Azaire';
        }

        // Send SMS
        const result = await sendSMS({
          to: driver.phone!,
          message,
          from: companyName
        });

        results.push({
          driverId: driver.id,
          driverName: driver.fullName,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        // Log the notification
        if (result.success) {
          await prisma.auditLog.create({
            data: {
              tenantId,
              userId: user.id,
              action: 'BULK_SMS_SENT',
              entityType: 'Driver',
              entityId: driver.id,
              details: {
                template,
                message,
                phone: driver.phone,
                messageId: result.messageId
              }
            }
          });
        }

        // Add delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          driverId: driver.id,
          driverName: driver.fullName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    revalidatePath('/drivers');
    return { success: true, results };
  } catch (error) {
    console.error('Bulk SMS notification error:', error);
    throw error;
  }
}
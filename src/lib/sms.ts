import AT from 'africastalking-ts';
import { prisma } from './prisma';
import { smsQueue } from './queue';

// Initialize Africa's Talking
const at = new (AT as any)({
  apiKey: process.env.AFRICAS_TALKING_API_KEY || '',
  username: process.env.AFRICAS_TALKING_USERNAME || '',
});

export interface SMSMessage {
  to: string;
  message: string;
  from?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export enum SMSTemplateType {
  WELCOME = 'welcome',
  REMITTANCE_RECEIVED = 'remittanceReceived',
  MAINTENANCE_REMINDER = 'maintenanceReminder',
  PAYMENT_REMINDER = 'paymentReminder',
  CONTRACT_EXPIRY = 'contractExpiry',
  SYSTEM_ALERT = 'systemAlert',
  SUBSCRIPTION_EXPIRY = 'subscriptionExpiry',
  INVOICE_DUE = 'invoiceDue',
  VEHICLE_ALERT = 'vehicleAlert',
  DRIVER_ASSIGNMENT = 'driverAssignment',
  CUSTOM = 'custom',
}

/**
 * Send SMS immediately (direct send)
 */
export async function sendSMS({
  to,
  message,
  from = 'Azaire',
  tenantId,
  metadata
}: SMSMessage): Promise<SMSResponse> {
  try {
    // Validate phone number (Zimbabwe format)
    const cleanNumber = to.replace(/\D/g, '');
    if (!cleanNumber.startsWith('263') && !cleanNumber.startsWith('+263')) {
      return {
        success: false,
        error: 'Invalid Zimbabwe phone number format'
      };
    }

    // Format phone number for Africa's Talking
    const formattedNumber = cleanNumber.startsWith('263') ? `+${cleanNumber}` : `+${cleanNumber}`;

    const result = await at.sms.send({
      to: [formattedNumber],
      message,
      from
    });

    const success = result.SMSMessageData?.Recipients?.[0]?.status === 'Success';
    const messageId = result.SMSMessageData?.Recipients?.[0]?.messageId;
    const error = result.SMSMessageData?.Recipients?.[0]?.status;

    // Log SMS (if we have a tenantId)
    if (tenantId) {
      try {
        await logSMS({
          tenantId,
          to: formattedNumber,
          message,
          status: success ? 'SENT' : 'FAILED',
          messageId,
          error: success ? undefined : error,
          metadata,
        });
      } catch (logError) {
        console.error('Failed to log SMS:', logError);
      }
    }

    if (success) {
      return {
        success: true,
        messageId
      };
    } else {
      return {
        success: false,
        error: error || 'Unknown error'
      };
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Send SMS via queue (recommended for reliability)
 */
export async function sendSMSQueued(message: SMSMessage): Promise<{ jobId: string }> {
  const job = await smsQueue.add('send-sms', message, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  return { jobId: job.id as string };
}

/**
 * Log SMS to database
 */
async function logSMS(data: {
  tenantId: string;
  to: string;
  message: string;
  status: string;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}) {
  // Note: This requires adding SMSLog model to Prisma schema
  // For now, we'll just log to console
  // TODO: Add SMSLog model and implement database logging
  console.log('SMS Log:', data);
}

export async function sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
  const results: SMSResponse[] = [];
  
  for (const message of messages) {
    const result = await sendSMS(message);
    results.push(result);
    
    // Add delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// SMS Templates
export const SMSTemplates = {
  welcome: (driverName: string, companyName: string) =>
    `Welcome to ${companyName}! Your driver account has been created. You can now start managing your fleet.`,

  remittanceReceived: (driverName: string, amount: number, vehicle: string) =>
    `Hi ${driverName}, your remittance of $${amount} for ${vehicle} has been received and is being processed.`,

  maintenanceReminder: (driverName: string, vehicle: string, serviceType: string) =>
    `Hi ${driverName}, ${vehicle} is due for ${serviceType}. Please schedule maintenance soon.`,

  paymentReminder: (driverName: string, amount: number, dueDate: string) =>
    `Hi ${driverName}, you have a payment of $${amount} due on ${dueDate}. Please make payment to avoid late fees.`,

  contractExpiry: (driverName: string, expiryDate: string) =>
    `Hi ${driverName}, your contract expires on ${expiryDate}. Please contact us to renew.`,

  systemAlert: (message: string) =>
    `Azaire Alert: ${message}`,

  subscriptionExpiry: (companyName: string, expiryDate: string) =>
    `Hi ${companyName}, your subscription expires on ${expiryDate}. Please renew to continue using our services.`,

  invoiceDue: (companyName: string, invoiceNumber: string, amount: number, dueDate: string) =>
    `Hi ${companyName}, invoice #${invoiceNumber} for $${amount} is due on ${dueDate}. Please make payment to avoid service interruption.`,

  vehicleAlert: (driverName: string, vehicle: string, alertType: string, message: string) =>
    `Hi ${driverName}, ${alertType} alert for ${vehicle}: ${message}`,

  driverAssignment: (driverName: string, vehicle: string, startDate: string) =>
    `Hi ${driverName}, you have been assigned to ${vehicle} starting ${startDate}. Good luck!`,

  custom: (message: string) => message
};

/**
 * Get SMS template by type
 */
export function getSMSTemplate(
  type: SMSTemplateType,
  params: Record<string, any>
): string {
  switch (type) {
    case SMSTemplateType.WELCOME:
      return SMSTemplates.welcome(params.driverName, params.companyName);
    case SMSTemplateType.REMITTANCE_RECEIVED:
      return SMSTemplates.remittanceReceived(params.driverName, params.amount, params.vehicle);
    case SMSTemplateType.MAINTENANCE_REMINDER:
      return SMSTemplates.maintenanceReminder(params.driverName, params.vehicle, params.serviceType);
    case SMSTemplateType.PAYMENT_REMINDER:
      return SMSTemplates.paymentReminder(params.driverName, params.amount, params.dueDate);
    case SMSTemplateType.CONTRACT_EXPIRY:
      return SMSTemplates.contractExpiry(params.driverName, params.expiryDate);
    case SMSTemplateType.SYSTEM_ALERT:
      return SMSTemplates.systemAlert(params.message);
    case SMSTemplateType.SUBSCRIPTION_EXPIRY:
      return SMSTemplates.subscriptionExpiry(params.companyName, params.expiryDate);
    case SMSTemplateType.INVOICE_DUE:
      return SMSTemplates.invoiceDue(params.companyName, params.invoiceNumber, params.amount, params.dueDate);
    case SMSTemplateType.VEHICLE_ALERT:
      return SMSTemplates.vehicleAlert(params.driverName, params.vehicle, params.alertType, params.message);
    case SMSTemplateType.DRIVER_ASSIGNMENT:
      return SMSTemplates.driverAssignment(params.driverName, params.vehicle, params.startDate);
    case SMSTemplateType.CUSTOM:
      return SMSTemplates.custom(params.message);
    default:
      return params.message || 'No message provided';
  }
}
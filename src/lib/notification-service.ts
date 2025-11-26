/**
 * Centralized Notification Service
 *
 * Handles all notifications across the system (SMS, Email, In-app)
 * Provides consistent notification templates and delivery mechanisms
 */

import { sendSMS, getSMSTemplate, SMSTemplateType } from './sms';
// import { sendEmail } from './email'; // TODO: Implement when email service is ready
import { prisma } from './prisma';
import { apiLogger } from './logger';

export enum NotificationType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  ALL = 'ALL', // Send to all available channels
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface NotificationPayload {
  type: NotificationType;
  priority?: NotificationPriority;
  recipientId?: string; // User/Driver ID
  recipientPhone?: string;
  recipientEmail?: string;
  subject?: string;
  message: string;
  template?: SMSTemplateType;
  templateParams?: Record<string, any>;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  channels: {
    sms?: { success: boolean; messageId?: string; error?: string };
    email?: { success: boolean; messageId?: string; error?: string };
    inApp?: { success: boolean; notificationId?: string; error?: string };
  };
  error?: string;
}

export class NotificationService {
  /**
   * Send a notification through the specified channel(s)
   * 
   * Supports multi-channel delivery (SMS, Email, In-App) with automatic fallback.
   * All channels are attempted concurrently for reliability.
   * 
   * @param payload - Notification configuration and content
   * @returns Detailed result for each channel attempted
   * 
   * @example
   * ```ts
   * const result = await NotificationService.send({
   *   type: NotificationType.ALL,
   *   recipientId: 'user_123',
   *   subject: 'Payment Received',
   *   message: 'Thank you for your payment!',
   *   tenantId: 'tenant_456'
   * });
   * console.log(result.success); // true if at least one channel succeeded
   * ```
   */
  static async send(payload: NotificationPayload): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      channels: {},
    };

    try {
      // Determine which channels to use
      const channels = this.getChannels(payload.type);

      // Send through each channel
      const promises = channels.map(async (channel) => {
        switch (channel) {
          case NotificationType.SMS:
            return this.sendSMS(payload);
          case NotificationType.EMAIL:
            return this.sendEmailNotification(payload);
          case NotificationType.IN_APP:
            return this.sendInAppNotification(payload);
          default:
            return { success: false, error: 'Unknown channel' };
        }
      });

      const results = await Promise.allSettled(promises);

      // Aggregate results
      // Aggregate results
      results.forEach((channelResult, index) => {
        const channel = channels[index];
        if (!channel) return;

        const channelKey = channel === NotificationType.IN_APP ? 'inApp' : channel.toLowerCase() as keyof typeof result.channels;

        if (channelResult.status === 'fulfilled' && channelResult.value) {
          // @ts-ignore - Dynamic key assignment
          result.channels[channelKey] = channelResult.value;
          if (channelResult.value.success) {
            result.success = true;
          }
        } else {
          // @ts-ignore - Dynamic key assignment
          result.channels[channelKey] = {
            success: false,
            error: channelResult.status === 'rejected' ? (channelResult.reason?.message || 'Unknown error') : 'Unknown error',
          };
        }
      });

      // Log the notification attempt
      apiLogger.info({
        payload,
        result,
      }, 'Notification sent');

      return result;
    } catch (error) {
      apiLogger.error({ err: error, payload }, 'Failed to send notification');
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(payload: NotificationPayload) {
    try {
      let message = payload.message;

      // Use template if provided
      if (payload.template && payload.templateParams) {
        message = getSMSTemplate(payload.template, payload.templateParams);
      }

      // Get recipient phone
      let phone = payload.recipientPhone;
      if (!phone && payload.recipientId) {
        phone = await this.getRecipientPhone(payload.recipientId) || undefined;
      }

      if (!phone) {
        return {
          success: false,
          error: 'Recipient phone number not found',
        };
      }

      const result = await sendSMS({
        to: phone,
        message,
        tenantId: payload.tenantId,
        metadata: payload.metadata,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS send failed',
      };
    }
  }

  /**
   * Send email notification
   */
  /**
   * Send email notification
   */
  private static async sendEmailNotification(payload: NotificationPayload) {
    try {
      // Get recipient email if not provided
      let email = payload.recipientEmail;
      if (!email && payload.recipientId) {
        email = await this.getRecipientEmail(payload.recipientId) || undefined;
      }

      if (!email) {
        return {
          success: false,
          error: 'Recipient email not found',
        };
      }

      // Import dynamically to avoid circular dependencies if any
      const { emailService } = await import('./email');

      const success = await emailService.sendEmail({
        to: email,
        subject: payload.subject || 'Notification from Fleet Manager',
        html: `<p>${payload.message}</p>`, // Basic HTML wrapper, can be improved with templates
        text: payload.message,
      });

      if (success) {
        return {
          success: true,
          messageId: `email-${Date.now()}`,
        };
      } else {
        return {
          success: false,
          error: 'Email service returned failure',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
      };
    }
  }

  /**
   * Send in-app notification
   */
  private static async sendInAppNotification(payload: NotificationPayload) {
    try {
      if (!payload.recipientId) {
        return {
          success: false,
          error: 'Recipient ID is required for in-app notifications',
        };
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: payload.recipientId,
          tenantId: payload.tenantId || null,
          type: 'INFO',
          title: payload.subject || 'Notification',
          message: payload.message,
          priority: payload.priority || NotificationPriority.NORMAL,
          read: false,
          metadata: payload.metadata || {},
        },
      });

      return {
        success: true,
        notificationId: notification.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'In-app notification failed',
      };
    }
  }

  /**
   * Get notification channels based on type
   */
  private static getChannels(type: NotificationType): NotificationType[] {
    if (type === NotificationType.ALL) {
      return [NotificationType.SMS, NotificationType.EMAIL, NotificationType.IN_APP];
    }
    return [type];
  }

  /**
   * Get recipient phone number
   */
  private static async getRecipientPhone(recipientId: string): Promise<string | null> {
    try {
      // Try user first
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true },
      });

      if (user?.email) {
        return user.email; // Assuming email might contain phone for SMS
      }

      // Try driver
      const driver = await prisma.driver.findUnique({
        where: { id: recipientId },
        select: { phone: true },
      });

      return driver?.phone || null;
    } catch (error) {
      apiLogger.error({ err: error, recipientId }, 'Failed to get recipient phone');
      return null;
    }
  }

  /**
   * Get recipient email
   */
  private static async getRecipientEmail(recipientId: string): Promise<string | null> {
    try {
      // Try user first
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true },
      });

      if (user?.email) {
        return user.email;
      }

      // Try driver
      const driver = await prisma.driver.findUnique({
        where: { id: recipientId },
        select: { email: true },
      });

      return driver?.email || null;
    } catch (error) {
      apiLogger.error({ err: error, recipientId }, 'Failed to get recipient email');
      return null;
    }
  }

  /**
   * Send payment success notification
   * 
   * Notifies user across all channels when payment is successfully processed.
   * Includes invoice details and amount paid.
   * 
   * @param tenantId - Tenant making the payment
   * @param userId - User to notify
   * @param amount - Payment amount
   * @param invoiceNumber - Invoice number paid
   * @returns Multi-channel notification result
   */
  static async notifyPaymentSuccess(
    tenantId: string,
    userId: string,
    amount: number,
    invoiceNumber: string
  ) {
    return this.send({
      type: NotificationType.ALL,
      priority: NotificationPriority.HIGH,
      recipientId: userId,
      tenantId,
      subject: 'Payment Successful',
      message: `Your payment of $${amount} for invoice ${invoiceNumber} has been successfully processed.`,
      metadata: {
        type: 'payment_success',
        invoiceNumber,
        amount,
      },
    });
  }

  /**
   * Send payment failed notification
   * 
   * Urgently notifies user when payment fails. Includes failure reason if available.
   * 
   * @param tenantId - Tenant attempting payment
   * @param userId - User to notify
   * @param amount - Payment amount that failed
   * @param invoiceNumber - Invoice number
   * @param reason - Optional failure reason
   * @returns Multi-channel notification result
   */
  static async notifyPaymentFailed(
    tenantId: string,
    userId: string,
    amount: number,
    invoiceNumber: string,
    reason?: string
  ) {
    return this.send({
      type: NotificationType.ALL,
      priority: NotificationPriority.URGENT,
      recipientId: userId,
      tenantId,
      subject: 'Payment Failed',
      message: `Your payment of $${amount} for invoice ${invoiceNumber} could not be processed.${reason ? ` Reason: ${reason}` : ''}`,
      metadata: {
        type: 'payment_failed',
        invoiceNumber,
        amount,
        reason,
      },
    });
  }

  /**
   * Notify all tenant admins of account suspension
   * 
   * Sends urgent notification to all admins when tenant account is suspended.
   * Typically due to non-payment or terms violation.
   * 
   * @param tenantId - Suspended tenant ID
   * @param tenantName - Tenant's display name
   * @param reason - Suspension reason
   * @returns Array of notification results (one per admin)
   */
  static async notifyAccountSuspended(tenantId: string, tenantName: string, reason: string) {
    // Get all tenant admins
    const admins = await prisma.user.findMany({
      where: {
        tenantId,
        role: {
          contains: 'TENANT_ADMIN',
        },
      },
      select: { id: true, email: true },
    });

    const notifications = admins.map((admin) =>
      this.send({
        type: NotificationType.ALL,
        priority: NotificationPriority.URGENT,
        recipientId: admin.id,
        recipientEmail: admin.email,
        tenantId,
        subject: 'Account Suspended',
        message: `Your account for ${tenantName} has been suspended. Reason: ${reason}. Please contact support or settle any outstanding payments to reactivate your account.`,
        metadata: {
          type: 'account_suspended',
          reason,
        },
      })
    );

    return Promise.allSettled(notifications);
  }

  static async notifyAccountReactivated(tenantId: string, tenantName: string) {
    const admins = await prisma.user.findMany({
      where: {
        tenantId,
        role: {
          contains: 'TENANT_ADMIN',
        },
      },
      select: { id: true, email: true },
    });

    const notifications = admins.map((admin) =>
      this.send({
        type: NotificationType.ALL,
        priority: NotificationPriority.HIGH,
        recipientId: admin.id,
        recipientEmail: admin.email,
        tenantId,
        subject: 'Account Reactivated',
        message: `Great news! Your account for ${tenantName} has been reactivated. You can now access all features.`,
        metadata: {
          type: 'account_reactivated',
        },
      })
    );

    return Promise.allSettled(notifications);
  }

  static async notifyUpgradeSuccess(
    tenantId: string,
    userId: string,
    newPlan: string
  ) {
    return this.send({
      type: NotificationType.ALL,
      priority: NotificationPriority.HIGH,
      recipientId: userId,
      tenantId,
      subject: 'Plan Upgrade Successful',
      message: `Your account has been successfully upgraded to the ${newPlan} plan. You now have access to all ${newPlan} features!`,
      metadata: {
        type: 'plan_upgrade',
        newPlan,
      },
    });
  }
}

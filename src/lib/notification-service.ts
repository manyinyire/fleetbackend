/**
 * Centralized Notification Service
 *
 * Handles all notifications across the system (SMS, Email, In-app)
 * Provides consistent notification templates and delivery mechanisms
 */

import { sendSMS, getSMSTemplate, SMSTemplateType } from './sms';
import { sendEmail } from './email';
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
        }
      });

      const results = await Promise.allSettled(promises);

      // Aggregate results
      results.forEach((channelResult, index) => {
        const channel = channels[index];
        if (channelResult.status === 'fulfilled') {
          result.channels[channel.toLowerCase() as keyof typeof result.channels] = channelResult.value;
          if (channelResult.value.success) {
            result.success = true;
          }
        } else {
          result.channels[channel.toLowerCase() as keyof typeof result.channels] = {
            success: false,
            error: channelResult.reason?.message || 'Unknown error',
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
        phone = await this.getRecipientPhone(payload.recipientId);
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
  private static async sendEmailNotification(payload: NotificationPayload) {
    try {
      // Get recipient email
      let email = payload.recipientEmail;
      if (!email && payload.recipientId) {
        email = await this.getRecipientEmail(payload.recipientId);
      }

      if (!email) {
        return {
          success: false,
          error: 'Recipient email not found',
        };
      }

      const result = await sendEmail({
        to: email,
        subject: payload.subject || 'Notification from Azaire Fleet Manager',
        text: payload.message,
        html: `<p>${payload.message.replace(/\n/g, '<br>')}</p>`,
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      };
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
   * Convenience methods for common notifications
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

import { prisma } from './prisma';
import { emailService } from './email';
import { invoiceGenerator } from './invoice-generator';

class InvoiceReminderService {
  async checkAndSendReminders(): Promise<void> {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(now.getDate() + 1);

    // Find invoices due in 7 days
    await this.sendRemindersForDate(sevenDaysFromNow, 'SEVEN_DAYS');
    
    // Find invoices due in 3 days
    await this.sendRemindersForDate(threeDaysFromNow, 'THREE_DAYS');
    
    // Find invoices due in 1 day
    await this.sendRemindersForDate(oneDayFromNow, 'ONE_DAY');
    
    // Find overdue invoices
    await this.sendOverdueReminders();
  }

  private async sendRemindersForDate(targetDate: Date, reminderType: 'SEVEN_DAYS' | 'THREE_DAYS' | 'ONE_DAY'): Promise<void> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        tenant: {
          include: {
            settings: true,
            users: {
              where: {
                role: 'TENANT_ADMIN'
              },
              take: 1
            }
          }
        }
      }
    });

    for (const invoice of invoices) {
      // Check if reminder already sent for this invoice and type
      const existingReminder = await prisma.invoiceReminder.findFirst({
        where: {
          invoiceId: invoice.id,
          type: reminderType
        }
      });

      if (existingReminder) {
        continue; // Already sent
      }

      await this.sendInvoiceReminder(invoice, reminderType);
    }
  }

  private async sendOverdueReminders(): Promise<void> {
    const now = new Date();
    
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now
        }
      },
      include: {
        tenant: {
          include: {
            settings: true,
            users: {
              where: {
                role: 'TENANT_ADMIN'
              },
              take: 1
            }
          }
        }
      }
    });

    for (const invoice of overdueInvoices) {
      // Check if overdue reminder already sent in the last 7 days
      const recentOverdueReminder = await prisma.invoiceReminder.findFirst({
        where: {
          invoiceId: invoice.id,
          type: 'OVERDUE',
          sentAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          }
        }
      });

      if (recentOverdueReminder) {
        continue; // Already sent recently
      }

      await this.sendInvoiceReminder(invoice, 'OVERDUE');
    }
  }

  private async sendInvoiceReminder(invoice: any, reminderType: 'SEVEN_DAYS' | 'THREE_DAYS' | 'ONE_DAY' | 'OVERDUE'): Promise<void> {
    const tenant = invoice.tenant;
    const adminUser = tenant.users[0];

    if (!adminUser) {
      console.warn(`No admin user found for tenant ${tenant.id}`);
      return;
    }

    // Generate PDF if not exists
    let pdfBuffer: Buffer;
    if (invoice.pdfUrl) {
      // In production, you would download from S3
      // For now, we'll regenerate it
      const { pdf } = await invoiceGenerator.generateInvoice({
        tenantId: invoice.tenantId,
        type: invoice.type,
        plan: invoice.plan,
        amount: Number(invoice.amount),
        description: invoice.description,
        billingPeriod: invoice.billingPeriod
      });
      pdfBuffer = pdf;
    } else {
      const { pdf } = await invoiceGenerator.generateInvoice({
        tenantId: invoice.tenantId,
        type: invoice.type,
        plan: invoice.plan,
        amount: Number(invoice.amount),
        description: invoice.description,
        billingPeriod: invoice.billingPeriod
      });
      pdfBuffer = pdf;
    }

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      dueDate: invoice.dueDate.toLocaleDateString(),
      companyName: tenant.name,
      userName: adminUser.name
    };

    let emailSent = false;
    if (reminderType === 'OVERDUE') {
      emailSent = await emailService.sendInvoiceReminderEmail(adminUser.email, invoiceData, pdfBuffer);
    } else {
      emailSent = await emailService.sendInvoiceReminderEmail(adminUser.email, invoiceData, pdfBuffer);
    }

    if (emailSent) {
      // Record the reminder
      await prisma.invoiceReminder.create({
        data: {
          invoiceId: invoice.id,
          tenantId: invoice.tenantId,
          sentAt: new Date(),
          type: reminderType
        }
      });

      console.log(`Invoice reminder sent for ${invoice.invoiceNumber} (${reminderType})`);
    } else {
      console.error(`Failed to send invoice reminder for ${invoice.invoiceNumber}`);
    }
  }

  async scheduleReminders(): Promise<void> {
    // This would typically be called by a cron job
    try {
      await this.checkAndSendReminders();
      console.log('Invoice reminders processed successfully');
    } catch (error) {
      console.error('Error processing invoice reminders:', error);
    }
  }

  // Manual reminder sending for specific invoice
  async sendManualReminder(invoiceId: string): Promise<{ success: boolean; message: string }> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          include: {
            settings: true,
            users: {
              where: {
                role: 'TENANT_ADMIN'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status !== 'PENDING') {
      return { success: false, message: 'Invoice is not pending' };
    }

    const adminUser = invoice.tenant.users[0];
    if (!adminUser) {
      return { success: false, message: 'No admin user found for this tenant' };
    }

    try {
      await this.sendInvoiceReminder(invoice, 'CUSTOM' as any);
      return { success: true, message: 'Reminder sent successfully' };
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      return { success: false, message: 'Failed to send reminder' };
    }
  }
}

export const invoiceReminderService = new InvoiceReminderService();
export default invoiceReminderService;
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { apiLogger } from '@/lib/logger';

interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

/**
 * Comprehensive audit logging system
 */
export class AuditLogger {
  /**
   * Log an action to the audit trail
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      const session = await auth.api.getSession({ headers: await headers() }) as any;
      
      if (!session) {
        console.warn('No session available for audit logging');
        return;
      }

      const user = session.user;
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') || 
                       headersList.get('x-real-ip') || 
                       'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      await prisma.auditLog.create({
        data: {
          tenantId: (user as any).tenantId,
          userId: user.id,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          ipAddress,
          userAgent,
          details: data.metadata || {}
        }
      });
    } catch (error) {
      apiLogger.error({ err: error }, 'Failed to create audit log:');
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED', metadata?: any): Promise<void> {
    await this.log({
      action,
      entityType: 'AUTH',
      metadata: { ...metadata, timestamp: new Date().toISOString() }
    });
  }

  /**
   * Log CRUD operations
   */
  static async logCreate(entityType: string, entityId: string, newValues: any, metadata?: any): Promise<void> {
    await this.log({
      action: 'CREATE',
      entityType,
      entityId,
      newValues,
      metadata
    });
  }

  static async logUpdate(entityType: string, entityId: string, oldValues: any, newValues: any, metadata?: any): Promise<void> {
    await this.log({
      action: 'UPDATE',
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata
    });
  }

  static async logDelete(entityType: string, entityId: string, oldValues: any, metadata?: any): Promise<void> {
    await this.log({
      action: 'DELETE',
      entityType,
      entityId,
      oldValues,
      metadata
    });
  }

  /**
   * Log data exports
   */
  static async logExport(entityType: string, filters: any, format: string, metadata?: any): Promise<void> {
    await this.log({
      action: 'EXPORT',
      entityType,
      metadata: { filters, format, ...metadata }
    });
  }

  /**
   * Log bulk operations
   */
  static async logBulkAction(action: string, entityType: string, entityIds: string[], metadata?: any): Promise<void> {
    await this.log({
      action,
      entityType,
      metadata: { entityIds, count: entityIds.length, ...metadata }
    });
  }

  /**
   * Log notification events
   */
  static async logNotification(type: 'EMAIL' | 'SMS', recipient: string, subject?: string, metadata?: any): Promise<void> {
    await this.log({
      action: `${type}_SENT`,
      entityType: 'NOTIFICATION',
      metadata: { type, recipient, subject, ...metadata }
    });
  }

  /**
   * Log system configuration changes
   */
  static async logConfigChange(setting: string, oldValue: any, newValue: any, metadata?: any): Promise<void> {
    await this.log({
      action: 'CONFIG_UPDATE',
      entityType: 'SYSTEM',
      oldValues: { [setting]: oldValue },
      newValues: { [setting]: newValue },
      metadata
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(event: string, details: any): Promise<void> {
    await this.log({
      action: event,
      entityType: 'SECURITY',
      metadata: { severity: 'high', ...details }
    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters: {
    tenantId?: string;
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100
    });
  }

  /**
   * Export audit logs to CSV
   */
  static async exportToCSV(filters: any): Promise<string> {
    const logs = await this.getAuditLogs(filters);
    
    const headers = ['Date', 'User', 'Action', 'Entity Type', 'IP Address', 'User Agent'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.user?.name || 'Unknown',
      log.action,
      log.entityType,
      log.ipAddress,
      log.userAgent
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(tenantId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalLogs, actionCounts, entityCounts, recentLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true
      }),
      prisma.auditLog.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    return {
      totalLogs,
      actionCounts: actionCounts.map(a => ({ action: a.action, count: a._count })),
      entityCounts: entityCounts.map(e => ({ entityType: e.entityType, count: e._count })),
      recentLogs
    };
  }
}

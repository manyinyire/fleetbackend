/**
 * Base Service Class
 *
 * Abstract base class for all service classes to reduce code duplication.
 * Provides common functionality like tenant context, Prisma client setup,
 * and standardized error handling.
 */

import { PrismaClient } from '@prisma/client';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { dbLogger } from '@/lib/logger';
import { handlePrismaError } from '@/lib/errors';

export abstract class BaseService {
  protected prisma: PrismaClient;
  protected tenantId: string | null;

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
    this.prisma = tenantId
      ? getTenantPrisma(tenantId)
      : require('@/lib/prisma').prisma;
  }

  /**
   * Set tenant context for RLS (Row-Level Security)
   */
  protected async setContext(): Promise<void> {
    if (this.tenantId) {
      await setTenantContext(this.tenantId);
    }
  }

  /**
   * Execute operation with automatic context setup and error handling
   */
  protected async executeWithContext<T>(
    operation: () => Promise<T>,
    operationName: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    try {
      await this.setContext();
      const result = await operation();

      dbLogger.info(
        {
          tenantId: this.tenantId,
          operation: operationName,
          ...metadata,
        },
        `${operationName} completed successfully`
      );

      return result;
    } catch (error) {
      dbLogger.error(
        {
          err: error,
          tenantId: this.tenantId,
          operation: operationName,
          ...metadata,
        },
        `Error in ${operationName}`
      );
      throw handlePrismaError(error);
    }
  }

  /**
   * Get pagination parameters with validation
   */
  protected getPaginationParams(
    page?: number,
    limit?: number
  ): { skip: number; take: number } {
    const validPage = Math.max(1, page || 1);
    const validLimit = Math.min(100, Math.max(1, limit || 10));

    return {
      skip: (validPage - 1) * validLimit,
      take: validLimit,
    };
  }

  /**
   * Build pagination response
   */
  protected buildPaginationResponse(
    total: number,
    page: number,
    limit: number
  ) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }
}

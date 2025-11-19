/**
 * Query Optimization Utilities
 *
 * Provides utilities for optimizing database queries including:
 * - Query performance monitoring
 * - Common query patterns
 * - Caching helpers
 * - Query builders with optimizations
 */

import { PrismaClient } from '@prisma/client';
import { dbLogger, measureTime } from './logger';
import { cache } from 'react';

/**
 * Query performance monitor
 * Logs slow queries for optimization
 */
const SLOW_QUERY_THRESHOLD = 1000; // ms

export async function monitorQuery<T>(
  queryName: string,
  operation: () => Promise<T>
): Promise<T> {
  return await measureTime(
    operation,
    (duration) => {
      if (duration > SLOW_QUERY_THRESHOLD) {
        dbLogger.warn(
          {
            queryName,
            duration,
            threshold: SLOW_QUERY_THRESHOLD,
          },
          `Slow query detected: ${queryName}`
        );
      } else {
        dbLogger.debug(
          {
            queryName,
            duration,
          },
          `Query executed: ${queryName}`
        );
      }
    }
  );
}

/**
 * Common optimized select fields for relations
 * Use these to avoid selecting unnecessary fields
 */
export const optimizedSelects = {
  // Minimal user info
  userMinimal: {
    id: true,
    email: true,
    name: true,
    role: true,
  },

  // Minimal vehicle info
  vehicleMinimal: {
    id: true,
    registrationNumber: true,
    make: true,
    model: true,
    type: true,
    status: true,
  },

  // Minimal driver info
  driverMinimal: {
    id: true,
    fullName: true,
    phone: true,
    status: true,
  },

  // Minimal tenant info
  tenantMinimal: {
    id: true,
    name: true,
    slug: true,
    status: true,
  },
};

/**
 * Pagination helper
 * Calculates skip and take for pagination
 */
export function getPaginationParams(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page

  return { skip, take };
}

/**
 * Build where clause for search
 * Creates optimized OR conditions for search
 */
export function buildSearchWhere(
  search: string | undefined,
  fields: string[]
): any {
  if (!search) return {};

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
}

/**
 * Build where clause for date range
 */
export function buildDateRangeWhere(
  field: string,
  startDate?: Date,
  endDate?: Date
): any {
  if (!startDate && !endDate) return {};

  const where: any = {};
  if (startDate) where.gte = startDate;
  if (endDate) where.lte = endDate;

  return { [field]: where };
}

/**
 * Optimized pagination query
 * Runs count and data queries in parallel
 */
export async function paginatedQuery<T>(
  prisma: PrismaClient,
  model: string,
  options: {
    where?: any;
    include?: any;
    select?: any;
    orderBy?: any;
    page?: number;
    limit?: number;
  }
): Promise<{
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const { where = {}, include, select, orderBy, page = 1, limit = 10 } = options;
  const { skip, take } = getPaginationParams(page, limit);

  // Run count and data queries in parallel for better performance
  const [data, total] = await Promise.all([
    (prisma as any)[model].findMany({
      where,
      include,
      select,
      orderBy,
      skip,
      take,
    }),
    (prisma as any)[model].count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

/**
 * Cached query helper
 * Uses React cache() for per-request memoization
 */
export function cachedQuery<T>(
  fn: () => Promise<T>,
  cacheKey: string
): () => Promise<T> {
  return cache(async () => {
    dbLogger.debug({ cacheKey }, 'Executing cached query');
    return fn();
  });
}

/**
 * Batch loader helper
 * Loads multiple records by ID in a single query
 */
export async function batchLoad<T>(
  prisma: PrismaClient,
  model: string,
  ids: string[],
  select?: any
): Promise<Map<string, T>> {
  if (ids.length === 0) return new Map();

  const records = await (prisma as any)[model].findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select,
  });

  return new Map(records.map((r: any) => [r.id, r]));
}

/**
 * Query optimization recommendations
 */
export const QueryOptimizationTips = {
  /**
   * Use select instead of include when you don't need all fields
   */
  useSelectNotInclude: `
    // BAD: Fetches all fields
    const user = await prisma.user.findMany({
      include: { tenant: true }
    });

    // GOOD: Only fetches needed fields
    const user = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        tenant: {
          select: { id: true, name: true }
        }
      }
    });
  `,

  /**
   * Use pagination for large datasets
   */
  usePagination: `
    // BAD: Fetches all records
    const vehicles = await prisma.vehicle.findMany();

    // GOOD: Paginated query
    const { data, pagination } = await paginatedQuery(
      prisma,
      'vehicle',
      { page: 1, limit: 20 }
    );
  `,

  /**
   * Use indexes for frequently queried fields
   */
  useIndexes: `
    // Add indexes in schema.prisma:
    @@index([tenantId])
    @@index([tenantId, status])
    @@index([tenantId, createdAt])
  `,

  /**
   * Run independent queries in parallel
   */
  useParallelQueries: `
    // BAD: Sequential queries
    const vehicles = await prisma.vehicle.count();
    const drivers = await prisma.driver.count();

    // GOOD: Parallel queries
    const [vehicles, drivers] = await Promise.all([
      prisma.vehicle.count(),
      prisma.driver.count(),
    ]);
  `,

  /**
   * Use transactions for multiple related operations
   */
  useTransactions: `
    // GOOD: Atomic operations
    const [remittance, income] = await prisma.$transaction([
      prisma.remittance.create({ data: remittanceData }),
      prisma.income.create({ data: incomeData }),
    ]);
  `,

  /**
   * Use aggregations instead of fetching all records
   */
  useAggregations: `
    // BAD: Fetch all and calculate in JS
    const remittances = await prisma.remittance.findMany();
    const total = remittances.reduce((sum, r) => sum + r.amount, 0);

    // GOOD: Database aggregation
    const { _sum } = await prisma.remittance.aggregate({
      _sum: { amount: true }
    });
  `,

  /**
   * Use cached queries for repeated data
   */
  useCaching: `
    // Create cached version
    const getCachedVehicles = cachedQuery(
      () => prisma.vehicle.findMany(),
      'vehicles-list'
    );

    // Use in multiple places (only queries once per request)
    const vehicles1 = await getCachedVehicles();
    const vehicles2 = await getCachedVehicles(); // Uses cache
  `,
};

/**
 * Performance monitoring for queries
 */
export class QueryPerformanceMonitor {
  private queries: Map<
    string,
    { count: number; totalDuration: number; maxDuration: number }
  > = new Map();

  /**
   * Track query execution
   */
  track(queryName: string, duration: number) {
    const stats = this.queries.get(queryName) || {
      count: 0,
      totalDuration: 0,
      maxDuration: 0,
    };

    stats.count++;
    stats.totalDuration += duration;
    stats.maxDuration = Math.max(stats.maxDuration, duration);

    this.queries.set(queryName, stats);
  }

  /**
   * Get statistics for all queries
   */
  getStats() {
    const stats = Array.from(this.queries.entries()).map(([name, data]) => ({
      queryName: name,
      executions: data.count,
      totalTime: data.totalDuration,
      avgTime: data.totalDuration / data.count,
      maxTime: data.maxDuration,
    }));

    return stats.sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = SLOW_QUERY_THRESHOLD) {
    return this.getStats().filter(q => q.maxTime > threshold);
  }

  /**
   * Reset statistics
   */
  reset() {
    this.queries.clear();
  }

  /**
   * Log statistics
   */
  logStats() {
    const stats = this.getStats();
    dbLogger.info({ queryStats: stats }, 'Query performance statistics');
  }
}

// Global performance monitor instance
export const queryMonitor = new QueryPerformanceMonitor();

/**
 * Optimized query builder for common patterns
 */
export class QueryBuilder {
  /**
   * Build optimized list query with filters and pagination
   */
  static list<T>(options: {
    model: string;
    select?: any;
    include?: any;
    where?: any;
    orderBy?: any;
    search?: { fields: string[]; term?: string };
    dateRange?: { field: string; start?: Date; end?: Date };
    page?: number;
    limit?: number;
  }) {
    const { model, select, include, where = {}, orderBy, search, dateRange, page, limit } = options;

    // Build combined where clause
    const combinedWhere = {
      ...where,
      ...( search?.term ? buildSearchWhere(search.term, search.fields) : {}),
      ...(dateRange ? buildDateRangeWhere(dateRange.field, dateRange.start, dateRange.end) : {}),
    };

    return {
      model,
      select,
      include,
      where: combinedWhere,
      orderBy,
      page,
      limit,
    };
  }
}

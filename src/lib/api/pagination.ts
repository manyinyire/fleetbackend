/**
 * Pagination Utilities
 * Provides consistent pagination across all API routes
 */
import { NextResponse } from 'next/server';
import { LIMITS } from '@/config/constants';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Parses pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(
    parseInt(searchParams.get('limit') || String(LIMITS.DEFAULT_PAGE_SIZE), 10),
    LIMITS.MAX_PAGE_SIZE
  );
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Calculates skip value for Prisma queries
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Builds pagination response
 */
export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  };
}

/**
 * Returns paginated JSON response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): Response {
  const result = buildPaginationResponse(data, total, page, limit);
  return NextResponse.json(result);
}

/**
 * Builds Prisma orderBy object from sort parameters
 */
export function buildOrderBy(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[] {
  if (!sortBy) {
    return { createdAt: sortOrder };
  }

  // Handle nested sorting (e.g., "user.name")
  if (sortBy.includes('.')) {
    const parts = sortBy.split('.');
    const result: any = {};
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = sortOrder;
    return result;
  }

  return { [sortBy]: sortOrder };
}

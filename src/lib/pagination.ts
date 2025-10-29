/**
 * Pagination utilities for API endpoints
 */

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Parse pagination parameters from URLSearchParams
 * 
 * @param searchParams - URLSearchParams from request
 * @param defaults - Default values for pagination
 * @returns Parsed pagination parameters
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: Partial<PaginationParams> = {}
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1)));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 10)))
  );
  const sortBy = searchParams.get('sortBy') || defaults.sortBy;
  const sortOrder = (searchParams.get('sortOrder') || defaults.sortOrder || 'desc') as 'asc' | 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Calculate pagination metadata
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @param totalCount - Total number of items
 * @returns Pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  totalCount: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
}

/**
 * Get Prisma skip value for pagination
 * 
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Number of records to skip
 */
export function getSkipValue(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create a paginated response
 * 
 * @param data - Array of data items
 * @param page - Current page number
 * @param limit - Items per page
 * @param totalCount - Total number of items
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalCount: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePaginationMeta(page, limit, totalCount),
  };
}

/**
 * Build Prisma orderBy clause from sort parameters
 * 
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort direction
 * @returns Prisma orderBy object
 */
export function buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
  if (!sortBy) {
    return undefined;
  }

  return { [sortBy]: sortOrder };
}

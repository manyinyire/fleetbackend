/**
 * Unit tests for pagination utilities
 */
import { describe, it, expect } from '@jest/globals';
import {
  parsePaginationParams,
  calculatePaginationMeta,
  getSkipValue,
  createPaginatedResponse,
  buildOrderBy,
} from '@/lib/pagination';

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should parse pagination parameters from URLSearchParams', () => {
      const params = new URLSearchParams({
        page: '2',
        limit: '20',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const result = parsePaginationParams(params);

      expect(result).toEqual({
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      });
    });

    it('should use default values when params are missing', () => {
      const params = new URLSearchParams();

      const result = parsePaginationParams(params, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should enforce minimum page value of 1', () => {
      const params = new URLSearchParams({ page: '0' });
      const result = parsePaginationParams(params);
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const params = new URLSearchParams({ limit: '200' });
      const result = parsePaginationParams(params);
      expect(result.limit).toBe(100);
    });
  });

  describe('calculatePaginationMeta', () => {
    it('should calculate pagination metadata correctly', () => {
      const meta = calculatePaginationMeta(2, 10, 45);

      expect(meta).toEqual({
        page: 2,
        limit: 10,
        totalCount: 45,
        totalPages: 5,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('should handle first page correctly', () => {
      const meta = calculatePaginationMeta(1, 10, 45);

      expect(meta.hasPrevPage).toBe(false);
      expect(meta.hasNextPage).toBe(true);
    });

    it('should handle last page correctly', () => {
      const meta = calculatePaginationMeta(5, 10, 45);

      expect(meta.hasPrevPage).toBe(true);
      expect(meta.hasNextPage).toBe(false);
    });
  });

  describe('getSkipValue', () => {
    it('should calculate skip value correctly', () => {
      expect(getSkipValue(1, 10)).toBe(0);
      expect(getSkipValue(2, 10)).toBe(10);
      expect(getSkipValue(3, 20)).toBe(40);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create a paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = createPaginatedResponse(data, 1, 10, 25);

      expect(response).toEqual({
        data,
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false,
        },
      });
    });
  });

  describe('buildOrderBy', () => {
    it('should build orderBy object', () => {
      const orderBy = buildOrderBy('name', 'asc');
      expect(orderBy).toEqual({ name: 'asc' });
    });

    it('should return undefined when sortBy is not provided', () => {
      const orderBy = buildOrderBy();
      expect(orderBy).toBeUndefined();
    });
  });
});

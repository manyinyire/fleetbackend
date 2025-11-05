/**
 * API Route Middleware
 *
 * Higher-order functions and middleware for API routes to reduce duplication
 * and standardize request handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { createErrorResponse } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export interface ApiContext {
  user: any;
  tenantId: string;
  prisma: PrismaClient;
  request: NextRequest;
}

export type ApiHandler = (
  context: ApiContext
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap API route with tenant authentication and error handling
 */
export function withTenantAuth(handler: ApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    try {
      // Authenticate and get tenant
      const { user, tenantId } = await requireTenant();

      // Set RLS context
      if (tenantId) {
        await setTenantContext(tenantId);
      }

      // Get scoped Prisma client
      const prisma = tenantId
        ? getTenantPrisma(tenantId)
        : require('@/lib/prisma').prisma;

      // Create context
      const context: ApiContext = {
        user,
        tenantId,
        prisma,
        request,
      };

      // Execute handler
      const response = await handler(context);

      // Log success
      const duration = Date.now() - startTime;
      apiLogger.info(
        {
          method,
          url,
          status: response.status,
          duration,
          tenantId,
          userId: user?.id,
        },
        'API request completed'
      );

      return response;
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      apiLogger.error(
        {
          err: error,
          method,
          url,
          duration,
        },
        'API request failed'
      );

      // Return error response
      return createErrorResponse(error);
    }
  };
}

/**
 * Validate request body with Zod schema
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new Error('Invalid request body');
  }
}

/**
 * Get pagination parameters from search params
 */
export function getPaginationFromRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  };
}

/**
 * Get date range from search params
 */
export function getDateRangeFromRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  return {
    startDate: startDateParam ? new Date(startDateParam) : undefined,
    endDate: endDateParam ? new Date(endDateParam) : undefined,
  };
}

/**
 * Build pagination response
 */
export function paginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wrap API route with error handling only (no auth required)
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    try {
      const response = await handler(request);

      const duration = Date.now() - startTime;
      apiLogger.info(
        {
          method,
          url,
          status: response.status,
          duration,
        },
        'API request completed'
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      apiLogger.error(
        {
          err: error,
          method,
          url,
          duration,
        },
        'API request failed'
      );

      return createErrorResponse(error);
    }
  };
}

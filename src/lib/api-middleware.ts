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
import { ServiceContainer } from '@/lib/service-container';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export interface ApiContext {
  user: any;
  tenantId: string | null;
  prisma: PrismaClient;
  services: ServiceContainer;
  request: NextRequest;
}

export interface TenantApiContext extends Omit<ApiContext, 'tenantId'> {
  tenantId: string;
}

export type ApiHandler = (
  context: ApiContext
) => Promise<NextResponse> | NextResponse;

export type TenantApiHandler = (
  context: TenantApiContext
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap API route with tenant authentication and error handling
 */
export function withTenantAuth(handler: TenantApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    try {
      // Authenticate and get tenant
      const { user, tenantId } = await requireTenant();

      // Ensure tenantId is not null for tenant-specific routes
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant context required for this operation' },
          { status: 400 }
        );
      }

      // Set RLS context
      if (tenantId) {
        await setTenantContext(tenantId);
      }

      // Get scoped Prisma client
      const prisma = tenantId
        ? getTenantPrisma(tenantId)
        : require('@/lib/prisma').prisma;

      // Create service container for dependency injection
      const services = new ServiceContainer(tenantId);

      // Create context with guaranteed non-null tenantId
      const context: TenantApiContext = {
        user,
        tenantId,
        prisma,
        services,
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
      // Next.js redirect() throws a special error that should be handled differently in API routes
      // Check if this is a redirect error (NEXT_REDIRECT)
      if (error && typeof error === 'object' && 'digest' in error) {
        const errorDigest = (error as any).digest;
        if (typeof errorDigest === 'string' && errorDigest.startsWith('NEXT_REDIRECT')) {
          // In API routes, convert redirect errors to JSON error responses
          // Extract the redirect path from the error digest
          const redirectMatch = errorDigest.match(/NEXT_REDIRECT;replace;(.+)/);
          const redirectPath = redirectMatch ? redirectMatch[1] : '/auth/sign-in';
          
          // Log error
          const duration = Date.now() - startTime;
          apiLogger.error(
            {
              err: error,
              method,
              url,
              duration,
              redirectPath,
            },
            'API request failed - authentication required'
          );

          // Return JSON error response instead of redirecting
          return NextResponse.json(
            {
              error: 'Authentication required',
              code: 'AUTHENTICATION_ERROR',
              redirectTo: redirectPath,
            },
            { status: 401 }
          );
        }
      }

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
      // Next.js redirect() throws a special error that should be re-thrown
      // Check if this is a redirect error (NEXT_REDIRECT)
      if (error && typeof error === 'object' && 'digest' in error) {
        const errorDigest = (error as any).digest;
        if (typeof errorDigest === 'string' && errorDigest.startsWith('NEXT_REDIRECT')) {
          // Re-throw redirect errors so Next.js can handle them properly
          throw error;
        }
      }

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

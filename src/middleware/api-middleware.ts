/**
 * Centralized API middleware
 * Handles validation, tenant context, rate limiting, and error handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { requireTenant, requireAuth, requireRole } from '@/lib/auth-helpers';
import { setTenantContext } from '@/lib/tenant';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, ApiErrors } from '@/lib/api-error';
import { withSecurityHeaders, withRateLimit, getRateLimiterForPath, getSanitizedBody } from './security';
import { logger, logHttpRequest, logHttpResponse } from '@/lib/logger';

export interface ApiContext {
  user: any;
  tenantId: string | null;
  prisma: any;
  body?: any;
  params?: Record<string, string>;
  searchParams?: URLSearchParams;
}

export interface ApiMiddlewareConfig {
  auth?: 'required' | 'optional' | 'none';
  role?: string | string[];
  requireTenant?: boolean;
  validate?: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  };
  rateLimit?: boolean;
}

/**
 * Create an API route handler with middleware
 */
export function createApiHandler(
  config: ApiMiddlewareConfig,
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, { params }: { params: Record<string, string> }): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      // Log request
      logHttpRequest({
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      });

      // Rate limiting
      if (config.rateLimit !== false) {
        const limiter = getRateLimiterForPath(request.nextUrl.pathname);
        const rateLimitResponse = withRateLimit(request, limiter);
        if (rateLimitResponse) {
          return withSecurityHeaders(rateLimitResponse);
        }
      }

      // Initialize context
      const context: ApiContext = {
        user: null,
        tenantId: null,
        prisma,
        params,
        searchParams: request.nextUrl.searchParams,
      };

      // Authentication
      if (config.auth === 'required') {
        if (config.role) {
          context.user = await requireRole(config.role);
        } else if (config.requireTenant) {
          const { user, tenantId } = await requireTenant();
          context.user = user;
          context.tenantId = tenantId;
          
          // Set tenant context
          if (tenantId) {
            await setTenantContext(tenantId);
            context.prisma = getTenantPrisma(tenantId);
          }
        } else {
          context.user = await requireAuth();
        }
      } else if (config.auth === 'optional') {
        try {
          context.user = await requireAuth();
        } catch {
          // Optional auth - continue without user
        }
      }

      // Parse and validate body
      if (request.method !== 'GET' && request.method !== 'DELETE') {
        context.body = await getSanitizedBody(request);
        
        if (config.validate?.body) {
          context.body = config.validate.body.parse(context.body);
        }
      }

      // Validate query parameters
      if (config.validate?.query) {
        const queryParams = Object.fromEntries(context.searchParams?.entries() || []);
        config.validate.query.parse(queryParams);
      }

      // Validate path parameters
      if (config.validate?.params && params) {
        config.validate.params.parse(params);
      }

      // Call handler
      const response = await handler(request, context);

      // Add security headers
      const securedResponse = withSecurityHeaders(response);

      // Log response
      logHttpResponse(
        { method: request.method, url: request.url },
        { status: response.status },
        Date.now() - startTime
      );

      return securedResponse;
    } catch (error) {
      return withSecurityHeaders(createErrorResponse(error, {
        method: request.method,
        url: request.url,
        duration: Date.now() - startTime,
      }));
    }
  };
}

/**
 * Shorthand for GET endpoints
 */
export function createGetHandler(
  config: Omit<ApiMiddlewareConfig, 'validate'> & { validate?: { query?: ZodSchema; params?: ZodSchema } },
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>
) {
  return createApiHandler({ ...config, rateLimit: config.rateLimit !== false }, handler);
}

/**
 * Shorthand for POST endpoints
 */
export function createPostHandler(
  config: ApiMiddlewareConfig,
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>
) {
  return createApiHandler({ ...config, rateLimit: config.rateLimit !== false }, handler);
}

/**
 * Shorthand for PUT/PATCH endpoints
 */
export function createPutHandler(
  config: ApiMiddlewareConfig,
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>
) {
  return createApiHandler({ ...config, rateLimit: config.rateLimit !== false }, handler);
}

/**
 * Shorthand for DELETE endpoints
 */
export function createDeleteHandler(
  config: Omit<ApiMiddlewareConfig, 'validate'> & { validate?: { params?: ZodSchema } },
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>
) {
  return createApiHandler({ ...config, rateLimit: config.rateLimit !== false }, handler);
}

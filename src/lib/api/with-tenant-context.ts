/**
 * Tenant Context Wrapper
 * Provides consistent tenant context setup across all API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { prisma as globalPrisma } from '@/lib/prisma';

export interface TenantContext {
  prisma: PrismaClient;
  tenantId: string | null;
  user: any;
}

/**
 * Wraps a handler to provide tenant context automatically
 */
export function withTenantContext(
  handler: (context: TenantContext, request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const { user, tenantId } = await requireTenant();

    // Set RLS context if tenant ID exists
    if (tenantId) {
      await setTenantContext(tenantId);
    }

    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : globalPrisma;

    return handler({ prisma, tenantId, user }, request);
  };
}

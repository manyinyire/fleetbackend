import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Verify that the current user is a Super Admin
 * Returns the session if valid, or an error response
 */
export async function requireSuperAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 }),
      session: null
    };
  }

  if ((session.user as any).role !== 'SUPER_ADMIN') {
    return {
      error: NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 }),
      session: null
    };
  }

  return {
    error: null,
    session
  };
}

/**
 * Wrapper for admin route handlers that automatically checks Super Admin auth
 * @param handler The route handler function
 * @returns A wrapped handler with auth checks
 */
export function withSuperAdmin<T extends any[]>(
  handler: (request: NextRequest, session: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const { error, session } = await requireSuperAdmin();

    if (error) {
      return error;
    }

    try {
      return await handler(request, session!, ...args);
    } catch (err) {
      console.error('Admin route error:', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to build pagination response
 */
export function buildPaginationResponse<T>(
  data: T[],
  page: number,
  limit: number,
  totalCount: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  };
}

/**
 * Helper to parse pagination parameters from URL
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Helper to build sort parameters
 */
export function parseSortParams(searchParams: URLSearchParams, defaultSort = 'createdAt') {
  const sortBy = searchParams.get('sortBy') || defaultSort;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  return { sortBy, sortOrder, orderBy };
}

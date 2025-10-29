/**
 * Authentication helper functions for server-side operations
 * @module auth-helpers
 */
import { auth } from './auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

/**
 * Get the current authenticated user (cached per request)
 * 
 * @returns The authenticated user or null if not authenticated
 * @example
 * ```ts
 * const user = await getCurrentUser();
 * if (!user) {
 *   redirect('/auth/sign-in');
 * }
 * ```
 */
export const getCurrentUser = cache(async () => {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    console.log('Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
});

/**
 * Require authentication for a server-side operation
 * Redirects to sign-in page if user is not authenticated
 * 
 * @returns The authenticated user
 * @throws Redirects to /auth/sign-in if not authenticated
 * @example
 * ```ts
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *   return <div>Welcome {user.name}</div>;
 * }
 * ```
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return user;
}

/**
 * Require a specific role for a server-side operation
 * Redirects if user doesn't have the required role
 * 
 * @param role - Required role(s) - can be a single role or array of roles
 * @returns The authenticated user with the required role
 * @throws Redirects to appropriate page if user lacks required role
 * @example
 * ```ts
 * export default async function AdminPage() {
 *   const user = await requireRole('SUPER_ADMIN');
 *   // Only SUPER_ADMIN can access this
 * }
 * ```
 */
export async function requireRole(role: string | string[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes((user as any).role as string)) {
    // If checking for SUPER_ADMIN and user doesn't have it, redirect to regular dashboard
    if (roles.includes('SUPER_ADMIN')) {
      redirect('/dashboard');
    }
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}

/**
 * Require tenant context for a server-side operation
 * Returns null tenantId for SUPER_ADMIN users
 * Checks tenant status and redirects if suspended/canceled
 * 
 * @returns Object containing user and tenantId (null for SUPER_ADMIN)
 * @throws Redirects if user is not authenticated or tenant is suspended
 * @example
 * ```ts
 * export default async function TenantPage() {
 *   const { user, tenantId } = await requireTenant();
 *   // Use tenantId to filter data
 * }
 * ```
 */
export async function requireTenant() {
  const user = await requireAuth();

  // SUPER_ADMIN users don't have a tenantId
  if ((user as any).role === 'SUPER_ADMIN') {
    return { user, tenantId: null };
  }

  if (!(user as any).tenantId) {
    throw new Error('No tenant context');
  }

  // Check if tenant is suspended or cancelled
  const tenant = await prisma.tenant.findUnique({
    where: { id: (user as any).tenantId as string },
    select: { status: true, name: true }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.status === 'SUSPENDED') {
    redirect('/suspended');
  }

  if (tenant.status === 'CANCELED') {
    redirect('/cancelled');
  }

  return { user, tenantId: (user as any).tenantId as string };
}

// Server-side: Require tenant context and redirect SUPER_ADMIN to admin dashboard
export async function requireTenantForDashboard() {
  const { user, tenantId } = await requireTenant();
  
  // SUPER_ADMIN users should be redirected to admin dashboard
  if ((user as any).role === 'SUPER_ADMIN') {
    redirect('/admin/dashboard');
  }
  
  // Regular tenant users must have a tenantId
  if (!tenantId) {
    throw new Error('No tenant context available');
  }
  
  return { user, tenantId };
}

// Server-side: Require SUPER_ADMIN role
export async function requireSuperAdmin() {
  const user = await requireAuth();
  
  if ((user as any).role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }
  
  return user;
}
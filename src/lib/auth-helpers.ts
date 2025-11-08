import { auth } from './auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { authLogger } from './logger';

// Server-side: Get current user (cached per request)
export const getCurrentUser = cache(async () => {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    authLogger.debug({
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    }, 'Session check');

    if (!session?.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    authLogger.error({ err: error }, 'Error getting session');
    return null;
  }
});

// Server-side: Require authentication
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Check email verification (unless SUPER_ADMIN)
  if ((user as any).role !== 'SUPER_ADMIN' && !user.emailVerified) {
    redirect('/auth/email-verified?unverified=true');
  }

  return user;
}

// Server-side: Require specific role
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

// Server-side: Require tenant context (handles SUPER_ADMIN)
export async function requireTenant() {
  const user = await requireAuth();

  // SUPER_ADMIN users don't have a tenantId
  if ((user as any).role === 'SUPER_ADMIN') {
    return { user, tenantId: null };
  }

  // CRITICAL: Every non-SUPER_ADMIN user MUST have a tenantId
  // If they don't, this is a data integrity issue that needs admin intervention
  if (!(user as any).tenantId) {
    authLogger.error({
      userId: user.id,
      email: user.email,
      role: (user as any).role,
    }, 'User without tenant attempted to access tenant-required resource');

    // Redirect to an error page explaining the issue
    redirect('/auth/error?type=no_tenant');
  }

  // Check if tenant exists and is valid
  const tenant = await prisma.tenant.findUnique({
    where: { id: (user as any).tenantId as string },
    select: { status: true, name: true }
  });

  if (!tenant) {
    authLogger.error({
      userId: user.id,
      tenantId: (user as any).tenantId,
    }, 'User has tenantId but tenant not found in database');

    redirect('/auth/error?type=tenant_not_found');
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

  // SUPER_ADMIN users should be redirected to superadmin dashboard
  if ((user as any).role === 'SUPER_ADMIN') {
    redirect('/superadmin/dashboard');
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
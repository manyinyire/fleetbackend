import { auth } from './auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';

// Server-side: Get current user (cached per request)
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

// Server-side: Require authentication
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

// Server-side: Require specific role
export async function requireRole(role: string | string[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(user.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}

// Server-side: Require tenant context (handles SUPER_ADMIN)
export async function requireTenant() {
  const user = await requireAuth();
  
  // SUPER_ADMIN users don't have a tenantId
  if (user.role === 'SUPER_ADMIN') {
    return { user, tenantId: null };
  }
  
  if (!user.tenantId) {
    throw new Error('No tenant context');
  }
  
  return { user, tenantId: user.tenantId as string };
}

// Server-side: Require tenant context and redirect SUPER_ADMIN to admin dashboard
export async function requireTenantForDashboard() {
  const { user, tenantId } = await requireTenant();
  
  // SUPER_ADMIN users should be redirected to admin dashboard
  if (user.role === 'SUPER_ADMIN') {
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
  
  if (user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }
  
  return user;
}
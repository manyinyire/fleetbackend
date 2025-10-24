import { auth } from './auth';
import { cookies } from 'next/headers';
import { cache } from 'react';

// Server-side: Get current user (cached per request)
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await cookies(),
  });
  
  return session?.user || null;
});

// Server-side: Require authentication
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

// Server-side: Require specific role
export async function requireRole(role: string | string[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];
  
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  
  return user;
}

// Server-side: Require tenant context
export async function requireTenant() {
  const user = await requireAuth();
  
  if (!user.tenantId) {
    throw new Error('No tenant context');
  }
  
  return { user, tenantId: user.tenantId };
}
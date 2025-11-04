import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimitMiddleware, rateLimitConfigs } from '@/lib/rate-limit';

/**
 * Next.js Middleware for Authentication, Authorization, and Rate Limiting
 *
 * This middleware:
 * - Implements rate limiting to prevent abuse
 * - Protects routes requiring authentication
 * - Enforces email verification for non-admin users
 * - Sets tenant context headers for API routes
 * - Handles super admin route protection
 * - Redirects unauthenticated users to sign-in
 */

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/verify-email',
  '/auth/email-verified',
  '/landing',
];

// Auth-related routes that should be accessible without full auth
const authRoutes = [
  '/api/auth',
  '/api/superadmin/auth/login',
];

// Static assets and Next.js internals
const staticRoutes = [
  '/_next',
  '/manifest.json',
  '/sw.js',
  '/workbox-',
  '/icons/',
  '/favicon.ico',
];

// Super admin routes
const superAdminRoutes = [
  '/superadmin',
  '/admin/dashboard',
  '/api/superadmin',
  '/api/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets and Next.js internals
  if (staticRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Allow public routes
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next();
  }

  // 3. Apply rate limiting to auth routes (stricter limits)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    const rateLimitResult = rateLimitMiddleware(request, rateLimitConfigs.auth);
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }
    return NextResponse.next();
  }

  // 3b. Apply rate limiting to super admin routes
  if (superAdminRoutes.some(route => pathname.startsWith(route))) {
    const rateLimitResult = rateLimitMiddleware(request, rateLimitConfigs.superAdmin);
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }
  }

  // 3c. Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = rateLimitMiddleware(request, rateLimitConfigs.api);
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }
  }

  try {
    // 4. Get user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const user = session?.user;

    // 5. Redirect unauthenticated users to sign-in
    if (!user) {
      const signInUrl = new URL('/auth/sign-in', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // 6. Check email verification (except for super admin)
    const userRole = (user as any).role as string;
    const isEmailVerified = user.emailVerified;

    if (userRole !== 'SUPER_ADMIN' && !isEmailVerified) {
      // Allow access to email verification page
      if (!pathname.startsWith('/auth/email-verified') &&
          !pathname.startsWith('/auth/verify-email') &&
          !pathname.startsWith('/api/auth/verify-email') &&
          !pathname.startsWith('/api/auth/resend-verification')) {
        return NextResponse.redirect(new URL('/auth/email-verified?unverified=true', request.url));
      }
    }

    // 7. Protect super admin routes
    const isSuperAdminRoute = superAdminRoutes.some(route => pathname.startsWith(route));
    if (isSuperAdminRoute && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 8. Redirect super admin to admin dashboard if accessing tenant routes
    if (userRole === 'SUPER_ADMIN' &&
        (pathname.startsWith('/dashboard') ||
         pathname.startsWith('/vehicles') ||
         pathname.startsWith('/drivers'))) {
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
    }

    // 9. Set tenant context headers for API routes
    const response = NextResponse.next();

    if (pathname.startsWith('/api/') && (user as any).tenantId) {
      response.headers.set('x-tenant-id', (user as any).tenantId);
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-role', userRole || 'USER');
    }

    // 10. Set user context for all authenticated routes
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', userRole || 'USER');

    return response;
  } catch (error) {
    // Log error (use simple console in middleware due to Edge runtime limitations)
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware error:', error);
    }

    // On error, redirect to sign-in
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('error', 'auth_error');
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

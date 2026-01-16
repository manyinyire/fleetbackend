import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-edge';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/verify-email',
  '/auth/email-verified',
  '/auth/error',
  '/landing',
  '/maintenance',
];

// Auth-related API routes
const authApiRoutes = [
  '/api/auth',
];

// Public API routes
const publicApiRoutes = [
  '/api/platform/logo',
  '/api/platform/maintenance',
];

// Static assets
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

export default auth(async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets
  if (staticRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow auth API routes
  if (authApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get session from Auth.js
  const session = await auth();
  const user = session?.user;

  // If no user and not a public route, redirect to sign-in
  if (!user && !publicRoutes.includes(pathname)) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check super admin access
  if (superAdminRoutes.some(route => pathname.startsWith(route))) {
    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Add tenant context header for API routes
  if (pathname.startsWith('/api/') && user?.tenantId) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', user.tenantId);
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

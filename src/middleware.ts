import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Skip for public routes
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup' ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/manifest.json') ||
      request.nextUrl.pathname.startsWith('/sw.js') ||
      request.nextUrl.pathname.startsWith('/icons/')) {
    return NextResponse.next();
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Set tenant context for API routes
    if (request.nextUrl.pathname.startsWith('/api/') && session.user.tenantId) {
      const response = NextResponse.next();
      
      // Set headers for tenant context
      response.headers.set('x-tenant-id', session.user.tenantId);
      response.headers.set('x-user-role', session.user.role);
      
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/settings/:path*',
    '/vehicles/:path*',
    '/drivers/:path*',
    '/remittances/:path*',
    '/finances/:path*'
  ]
};
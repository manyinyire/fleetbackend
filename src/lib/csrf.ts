/**
 * CSRF Protection Middleware
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * This protects against Cross-Site Request Forgery attacks on state-changing operations.
 *
 * Note: NextAuth already includes CSRF protection for auth routes.
 * This middleware is for protecting custom API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { apiLogger } from './logger';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Verify CSRF token from request
 * Compares the token in the cookie with the token in the header
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  // Only check CSRF for state-changing methods
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true; // Safe methods don't need CSRF protection
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    apiLogger.warn(
      {
        method,
        path: request.nextUrl.pathname,
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
      },
      'CSRF token missing'
    );
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    const cookieBuffer = Buffer.from(cookieToken, 'hex');
    const headerBuffer = Buffer.from(headerToken, 'hex');

    if (cookieBuffer.length !== headerBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(cookieBuffer, headerBuffer);
  } catch (error) {
    apiLogger.error({ error }, 'CSRF token comparison failed');
    return false;
  }
}

/**
 * Middleware to check CSRF token
 * Returns error response if CSRF check fails
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  const isValid = verifyCsrfToken(request);

  if (!isValid) {
    apiLogger.warn(
      {
        method: request.method,
        path: request.nextUrl.pathname,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
      'CSRF token validation failed'
    );

    return NextResponse.json(
      {
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      },
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null; // Valid CSRF token, continue
}

/**
 * Higher-order function to wrap API routes with CSRF protection
 *
 * @example
 * ```ts
 * export const POST = withCsrfProtection(async (request: NextRequest) => {
 *   // Your handler code here
 * });
 * ```
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const csrfCheck = csrfMiddleware(request);
    if (csrfCheck) {
      return csrfCheck; // Return error response
    }
    return handler(request);
  };
}

/**
 * Set CSRF token cookie in response
 * Call this in routes that render forms or pages with API calls
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const response = NextResponse.json({ data: 'example' });
 *   setCsrfCookie(response);
 *   return response;
 * }
 * ```
 */
export function setCsrfCookie(response: NextResponse): void {
  const token = generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get the current CSRF token from request
 * Useful for generating a new token if one doesn't exist
 */
export function getCsrfToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * API endpoint to get CSRF token for client-side requests
 * This should be called by the frontend before making state-changing API requests
 *
 * Usage in API route:
 * ```ts
 * // src/app/api/csrf/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { generateCsrfToken } from '@/lib/csrf';
 *
 * export async function GET(request: NextRequest) {
 *   const token = generateCsrfToken();
 *   const response = NextResponse.json({ token });
 *
 *   response.cookies.set('csrf-token', token, {
 *     httpOnly: true,
 *     secure: process.env.NODE_ENV === 'production',
 *     sameSite: 'strict',
 *     path: '/',
 *     maxAge: 60 * 60 * 24,
 *   });
 *
 *   return response;
 * }
 * ```
 *
 * Usage in client:
 * ```ts
 * // Fetch CSRF token before making API calls
 * const response = await fetch('/api/csrf');
 * const { token } = await response.json();
 *
 * // Include token in subsequent requests
 * await fetch('/api/some-endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'x-csrf-token': token,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */

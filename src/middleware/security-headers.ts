/**
 * Security Headers Middleware
 *
 * Adds essential security headers to all responses to protect against common vulnerabilities:
 * - Content Security Policy (CSP) - Prevents XSS attacks
 * - Strict-Transport-Security (HSTS) - Enforces HTTPS
 * - X-Frame-Options - Prevents clickjacking
 * - X-Content-Type-Options - Prevents MIME type sniffing
 * - Referrer-Policy - Controls referrer information
 * - Permissions-Policy - Controls browser features
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers to add to all responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  // Content Security Policy (CSP)
  // This policy allows:
  // - Scripts from same origin and specific CDNs
  // - Styles from same origin and inline styles (needed for styled components)
  // - Images from same origin, data URIs, and external domains
  // - Fonts from same origin and Google Fonts
  // - Connect to same origin and specific APIs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com", // unsafe-eval needed for Next.js dev mode
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  // In development, relax CSP for hot reloading
  if (!isProduction) {
    cspDirectives.push("connect-src 'self' ws: wss: http: https:");
  }

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  // Strict-Transport-Security (HSTS)
  // Only enable in production and only over HTTPS
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-Frame-Options - Prevents clickjacking
  // DENY: Page cannot be displayed in a frame
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - Prevents MIME type sniffing
  // nosniff: Prevents browsers from MIME-sniffing responses
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-DNS-Prefetch-Control - Controls DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Referrer-Policy - Controls referrer information
  // strict-origin-when-cross-origin: Send full URL for same-origin, origin only for cross-origin
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );

  // Permissions-Policy - Controls browser features
  // Disable unnecessary features to reduce attack surface
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
    'payment=()',
    'usb=()',
  ];

  response.headers.set(
    'Permissions-Policy',
    permissionsPolicy.join(', ')
  );

  // X-XSS-Protection - Legacy XSS protection (for older browsers)
  // 1; mode=block: Enable XSS filtering and block page if attack detected
  // Note: Modern browsers use CSP instead, but this helps older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Remove potentially sensitive headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

/**
 * Middleware function to add security headers to all responses
 * Can be used in Next.js middleware or API routes
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  // Create a response
  const response = NextResponse.next();

  // Add security headers
  return addSecurityHeaders(response);
}

/**
 * Higher-order function to wrap API routes with security headers
 *
 * @example
 * ```typescript
 * export const GET = withSecurityHeaders(async (request: NextRequest) => {
 *   // Your API logic here
 *   return NextResponse.json({ data: 'example' });
 * });
 * ```
 */
export function withSecurityHeaders(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    return addSecurityHeaders(response);
  };
}

/**
 * Security headers configuration for Next.js config
 * Use this in next.config.js for global application of security headers
 *
 * @example
 * ```javascript
 * // next.config.js
 * const { securityHeadersConfig } = require('./src/middleware/security-headers');
 *
 * module.exports = {
 *   async headers() {
 *     return [
 *       {
 *         source: '/(.*)',
 *         headers: securityHeadersConfig(),
 *       },
 *     ];
 *   },
 * };
 * ```
 */
export function securityHeadersConfig() {
  const isProduction = process.env.NODE_ENV === 'production';

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (!isProduction) {
    cspDirectives.push("connect-src 'self' ws: wss: http: https:");
  }

  const headers = [
    {
      key: 'Content-Security-Policy',
      value: cspDirectives.join('; '),
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
  ];

  // Add HSTS only in production
  if (isProduction) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    });
  }

  return headers;
}

/**
 * Security middleware for Next.js API routes
 * Includes: Security headers, rate limiting, input sanitization
 */
import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from '@/lib/logger';

/**
 * Add security headers to response
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://www.google-analytics.com https://*.amazonaws.com https://*.digitaloceanspaces.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  );
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

/**
 * In-memory rate limiter
 * For production, use Redis-backed rate limiter
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private limit: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (value.resetAt < now) {
        this.requests.delete(key);
      }
    }
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || record.resetAt < now) {
      // New window
      const resetAt = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt };
    }

    if (record.count >= this.limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    // Increment counter
    record.count++;
    this.requests.set(identifier, record);
    return { allowed: true, remaining: this.limit - record.count, resetAt: record.resetAt };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Global rate limiters
const globalLimiter = new RateLimiter(100, 60000); // 100 requests per minute
const authLimiter = new RateLimiter(5, 60000); // 5 auth attempts per minute
const strictLimiter = new RateLimiter(20, 60000); // 20 requests per minute for sensitive endpoints

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  request: NextRequest,
  limiter: RateLimiter = globalLimiter
): NextResponse | null {
  // Get identifier (IP address or user ID)
  const identifier =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const result = limiter.check(identifier);

  if (!result.allowed) {
    logSecurityEvent('rate_limit_exceeded', {
      identifier,
      path: request.nextUrl.pathname,
    });

    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': limiter['limit'].toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
        },
      }
    );
  }

  // Add rate limit headers to successful response
  return null; // Middleware should continue
}

/**
 * Get the appropriate rate limiter for a path
 */
export function getRateLimiterForPath(pathname: string): RateLimiter {
  // Stricter limits for auth endpoints
  if (pathname.includes('/api/auth/') || pathname.includes('/api/superadmin/auth/')) {
    return authLimiter;
  }

  // Strict limits for admin endpoints
  if (pathname.includes('/api/admin/') || pathname.includes('/api/superadmin/')) {
    return strictLimiter;
  }

  // Default rate limit
  return globalLimiter;
}

/**
 * Input sanitization to prevent XSS
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate and sanitize request body
 */
export async function getSanitizedBody(request: NextRequest): Promise<unknown> {
  try {
    const body = await request.json();
    return sanitizeInput(body);
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * CORS configuration for API routes
 */
export function withCORS(response: NextResponse, allowedOrigins: string[] = []): NextResponse {
  const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const allowed = allowedOrigins.length > 0 ? allowedOrigins : [origin];

  response.headers.set('Access-Control-Allow-Origin', allowed[0]);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Validate URL to prevent open redirects
 */
export function validateRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const parsed = new URL(url);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const baseDomain = new URL(baseUrl).hostname;

    // Allow relative URLs
    if (url.startsWith('/')) {
      return true;
    }

    // Check against allowed domains
    const allowed = [baseDomain, ...allowedDomains];
    return allowed.includes(parsed.hostname);
  } catch {
    // Invalid URL
    return false;
  }
}

// Export rate limiters for testing
export const rateLimiters = {
  global: globalLimiter,
  auth: authLimiter,
  strict: strictLimiter,
};

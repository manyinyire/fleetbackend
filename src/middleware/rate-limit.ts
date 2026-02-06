/**
 * Rate Limit Middleware
 * Apply rate limiting to API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function rateLimitMiddleware(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();
    
    if (!session?.user?.id) {
      // Rate limit by IP for unauthenticated requests
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      const result = await checkRateLimit(`ip:${ip}`, 'FREE');
      
      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': result.resetAt.toISOString(),
              'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
            }
          }
        );
      }
      
      return null; // Continue to next middleware
    }

    // Get user's tenant and plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        tenantId: true,
        tenant: {
          select: { plan: true }
        }
      },
    });

    const plan = user?.tenant?.plan || 'FREE';
    const identifier = user?.tenantId || session.user.id;

    // Check rate limit
    const result = await checkRateLimit(identifier, plan);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please upgrade your plan for higher limits.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
            'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    return response;
  } catch (error) {
    // Fail open - allow request if rate limiting fails
    console.error('Rate limit middleware error:', error);
    return null;
  }
}

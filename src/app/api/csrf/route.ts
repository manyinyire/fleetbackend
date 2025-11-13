/**
 * CSRF Token Endpoint
 *
 * Provides CSRF tokens for client-side requests.
 * The token is set as an httpOnly cookie and also returned in the response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  const token = generateCsrfToken();

  const response = NextResponse.json({
    token,
    message: 'CSRF token generated successfully',
  });

  // Set token as httpOnly cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

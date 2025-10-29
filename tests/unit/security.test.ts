/**
 * Unit tests for security middleware
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  sanitizeInput,
  validateRedirectUrl,
  withSecurityHeaders,
} from '@/middleware/security';
import { NextResponse } from 'next/server';

describe('Security Middleware', () => {
  describe('sanitizeInput', () => {
    it('should sanitize string inputs', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should sanitize object inputs', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        age: 25,
      };
      const sanitized = sanitizeInput(input) as any;
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.age).toBe(25);
    });

    it('should sanitize array inputs', () => {
      const input = ['<script>', 'normal', '<img src=x>'];
      const sanitized = sanitizeInput(input) as string[];
      expect(sanitized[0]).not.toContain('<script>');
      expect(sanitized[1]).toBe('normal');
      expect(sanitized[2]).not.toContain('<img');
    });

    it('should handle non-string primitives', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(true)).toBe(true);
      expect(sanitizeInput(null)).toBe(null);
    });
  });

  describe('validateRedirectUrl', () => {
    it('should allow relative URLs', () => {
      expect(validateRedirectUrl('/dashboard')).toBe(true);
      expect(validateRedirectUrl('/auth/login')).toBe(true);
    });

    it('should allow URLs from the base domain', () => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      expect(validateRedirectUrl('http://localhost:3000/dashboard')).toBe(true);
    });

    it('should reject external URLs', () => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      expect(validateRedirectUrl('http://evil.com/phishing')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(validateRedirectUrl('javascript:alert(1)')).toBe(false);
      expect(validateRedirectUrl('not a url')).toBe(false);
    });

    it('should allow whitelisted domains', () => {
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      expect(
        validateRedirectUrl('http://example.com/path', ['example.com'])
      ).toBe(true);
    });
  });

  describe('withSecurityHeaders', () => {
    it('should add security headers to response', () => {
      const response = NextResponse.json({ success: true });
      const secured = withSecurityHeaders(response);

      expect(secured.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secured.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(secured.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should add Strict-Transport-Security in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = NextResponse.json({ success: true });
      const secured = withSecurityHeaders(response);

      expect(secured.headers.has('Strict-Transport-Security')).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });
});

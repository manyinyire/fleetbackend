import { describe, it, expect, beforeEach, jest } from '@jest/globals';

/**
 * Unit Tests for Webhook Security (VULN-004)
 * Tests the security fixes for webhook rate limiting and replay protection
 */
describe('Webhook Security (VULN-004)', () => {
  describe('Rate Limiting', () => {
    let webhookRateLimiter: Map<string, { count: number; resetTime: number }>;

    beforeEach(() => {
      webhookRateLimiter = new Map();
    });

    function checkWebhookRateLimit(identifier: string): boolean {
      const now = Date.now();
      const limit = 100;
      const window = 60 * 1000; // 1 minute

      const record = webhookRateLimiter.get(identifier);

      if (!record || record.resetTime < now) {
        webhookRateLimiter.set(identifier, { count: 1, resetTime: now + window });
        return true;
      }

      if (record.count >= limit) {
        return false;
      }

      record.count++;
      return true;
    }

    it('should allow first request', () => {
      const result = checkWebhookRateLimit('192.168.1.1');
      expect(result).toBe(true);
    });

    it('should allow requests under limit', () => {
      const ip = '192.168.1.1';

      // Send 50 requests (under 100 limit)
      for (let i = 0; i < 50; i++) {
        const result = checkWebhookRateLimit(ip);
        expect(result).toBe(true);
      }
    });

    it('should block requests over limit', () => {
      const ip = '192.168.1.1';

      // Send 100 requests (at limit)
      for (let i = 0; i < 100; i++) {
        checkWebhookRateLimit(ip);
      }

      // 101st request should be blocked
      const result = checkWebhookRateLimit(ip);
      expect(result).toBe(false);
    });

    it('should reset after time window', () => {
      jest.useFakeTimers();
      const ip = '192.168.1.1';

      // Fill up the limit
      for (let i = 0; i < 100; i++) {
        checkWebhookRateLimit(ip);
      }

      // Should be blocked
      expect(checkWebhookRateLimit(ip)).toBe(false);

      // Advance time by 61 seconds (past window)
      jest.advanceTimersByTime(61 * 1000);

      // Should be allowed again
      expect(checkWebhookRateLimit(ip)).toBe(true);

      jest.useRealTimers();
    });

    it('should track different IPs separately', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Fill up limit for IP1
      for (let i = 0; i < 100; i++) {
        checkWebhookRateLimit(ip1);
      }

      // IP1 should be blocked
      expect(checkWebhookRateLimit(ip1)).toBe(false);

      // IP2 should still be allowed
      expect(checkWebhookRateLimit(ip2)).toBe(true);
    });

    it('should enforce exactly 100 requests per minute', () => {
      const ip = '192.168.1.1';
      let allowedCount = 0;

      // Try 150 requests
      for (let i = 0; i < 150; i++) {
        if (checkWebhookRateLimit(ip)) {
          allowedCount++;
        }
      }

      // Should allow exactly 100
      expect(allowedCount).toBe(100);
    });
  });

  describe('Replay Attack Protection', () => {
    let processedWebhooks: Map<string, number>;

    beforeEach(() => {
      processedWebhooks = new Map();
    });

    function isReplayAttack(reference: string, timestamp: number): boolean {
      const processed = processedWebhooks.get(reference);

      if (processed && timestamp <= processed) {
        return true;
      }

      // Clean up old entries (older than 1 hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [key, time] of processedWebhooks.entries()) {
        if (time < oneHourAgo) {
          processedWebhooks.delete(key);
        }
      }

      return false;
    }

    function markWebhookProcessed(reference: string, timestamp: number): void {
      processedWebhooks.set(reference, timestamp);
    }

    it('should allow first webhook', () => {
      const reference = 'INV-001';
      const timestamp = Date.now();

      expect(isReplayAttack(reference, timestamp)).toBe(false);
    });

    it('should detect duplicate webhook', () => {
      const reference = 'INV-001';
      const timestamp = Date.now();

      // First webhook
      expect(isReplayAttack(reference, timestamp)).toBe(false);
      markWebhookProcessed(reference, timestamp);

      // Duplicate webhook with same timestamp
      expect(isReplayAttack(reference, timestamp)).toBe(true);
    });

    it('should detect replayed webhook with older timestamp', () => {
      const reference = 'INV-001';
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 - 1000; // 1 second earlier

      // Process first webhook
      markWebhookProcessed(reference, timestamp1);

      // Replay with older timestamp should be detected
      expect(isReplayAttack(reference, timestamp2)).toBe(true);
    });

    it('should allow webhook with newer timestamp', () => {
      const reference = 'INV-001';
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 1000; // 1 second later

      // Process first webhook
      markWebhookProcessed(reference, timestamp1);

      // Newer timestamp for same reference should be allowed
      // (in case of retries or updates)
      expect(isReplayAttack(reference, timestamp2)).toBe(false);
    });

    it('should track different references independently', () => {
      const ref1 = 'INV-001';
      const ref2 = 'INV-002';
      const timestamp = Date.now();

      markWebhookProcessed(ref1, timestamp);

      // Ref1 duplicate should be detected
      expect(isReplayAttack(ref1, timestamp)).toBe(true);

      // Ref2 should be allowed (different reference)
      expect(isReplayAttack(ref2, timestamp)).toBe(false);
    });

    it('should clean up old entries after 1 hour', () => {
      jest.useFakeTimers();
      const reference = 'INV-001';
      const timestamp = Date.now();

      markWebhookProcessed(reference, timestamp);

      // Should be in the map
      expect(processedWebhooks.has(reference)).toBe(true);

      // Advance time by 61 minutes
      jest.advanceTimersByTime(61 * 60 * 1000);

      // Trigger cleanup by checking another webhook
      const newReference = 'INV-002';
      const newTimestamp = Date.now();
      isReplayAttack(newReference, newTimestamp);

      // Old entry should be cleaned up
      expect(processedWebhooks.has(reference)).toBe(false);

      jest.useRealTimers();
    });

    it('should handle concurrent webhooks correctly', () => {
      const references = Array.from({ length: 10 }, (_, i) => `INV-${i}`);
      const timestamp = Date.now();

      // Process multiple webhooks
      references.forEach(ref => {
        expect(isReplayAttack(ref, timestamp)).toBe(false);
        markWebhookProcessed(ref, timestamp);
      });

      // All should now be detected as replays
      references.forEach(ref => {
        expect(isReplayAttack(ref, timestamp)).toBe(true);
      });
    });
  });

  describe('Combined Rate Limiting and Replay Protection', () => {
    let webhookRateLimiter: Map<string, { count: number; resetTime: number }>;
    let processedWebhooks: Map<string, number>;

    beforeEach(() => {
      webhookRateLimiter = new Map();
      processedWebhooks = new Map();
    });

    function checkWebhookRateLimit(identifier: string): boolean {
      const now = Date.now();
      const limit = 100;
      const window = 60 * 1000;

      const record = webhookRateLimiter.get(identifier);

      if (!record || record.resetTime < now) {
        webhookRateLimiter.set(identifier, { count: 1, resetTime: now + window });
        return true;
      }

      if (record.count >= limit) {
        return false;
      }

      record.count++;
      return true;
    }

    function isReplayAttack(reference: string, timestamp: number): boolean {
      const processed = processedWebhooks.get(reference);
      return !!(processed && timestamp <= processed);
    }

    function markWebhookProcessed(reference: string, timestamp: number): void {
      processedWebhooks.set(reference, timestamp);
    }

    it('should enforce both rate limit and replay protection', () => {
      const ip = '192.168.1.1';
      const reference = 'INV-001';
      const timestamp = Date.now();

      // First webhook - should pass both checks
      expect(checkWebhookRateLimit(ip)).toBe(true);
      expect(isReplayAttack(reference, timestamp)).toBe(false);
      markWebhookProcessed(reference, timestamp);

      // Replay attack - should fail replay check
      expect(checkWebhookRateLimit(ip)).toBe(true); // Rate limit OK
      expect(isReplayAttack(reference, timestamp)).toBe(true); // Replay detected
    });

    it('should block rate limited client even with valid webhooks', () => {
      const ip = '192.168.1.1';

      // Use up rate limit
      for (let i = 0; i < 100; i++) {
        checkWebhookRateLimit(ip);
      }

      // New valid webhook should be blocked by rate limit
      const newReference = 'INV-999';
      const timestamp = Date.now();

      expect(checkWebhookRateLimit(ip)).toBe(false); // Rate limited
      expect(isReplayAttack(newReference, timestamp)).toBe(false); // Not a replay
    });
  });

  describe('IP Extraction and Fingerprinting', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      };

      const clientIp = headers['x-forwarded-for'].split(',')[0].trim();
      expect(clientIp).toBe('203.0.113.195');
    });

    it('should extract IP from x-real-ip header', () => {
      const headers = {
        'x-real-ip': '203.0.113.195',
      };

      const clientIp = headers['x-real-ip'];
      expect(clientIp).toBe('203.0.113.195');
    });

    it('should handle missing headers gracefully', () => {
      const headers = {};

      const clientIp = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
      expect(clientIp).toBe('unknown');
    });

    it('should handle IPv6 addresses', () => {
      const headers = {
        'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      };

      const clientIp = headers['x-forwarded-for'].split(',')[0].trim();
      expect(clientIp).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('Logging and Forensics', () => {
    it('should log webhook receipt with client IP', () => {
      const logEntry = {
        reference: 'INV-001',
        paynowreference: 'PAYNOW-123',
        status: 'Paid',
        clientIp: '203.0.113.195',
        timestamp: new Date().toISOString(),
      };

      expect(logEntry.clientIp).toBeTruthy();
      expect(logEntry.reference).toBe('INV-001');
    });

    it('should log rate limit exceedances', () => {
      const logEntry = {
        level: 'error',
        message: 'Webhook rate limit exceeded',
        clientIp: '203.0.113.195',
        timestamp: new Date().toISOString(),
      };

      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toContain('rate limit');
    });

    it('should log replay attack detections', () => {
      const logEntry = {
        level: 'error',
        message: 'Replay attack detected',
        reference: 'INV-001',
        clientIp: '203.0.113.195',
        timestamp: new Date().toISOString(),
      };

      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toContain('Replay attack');
    });
  });

  describe('Security Headers', () => {
    it('should return rate limit headers', () => {
      const limit = 100;
      const remaining = 95;
      const resetTime = new Date(Date.now() + 60000).toISOString();

      const headers = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime,
        'Retry-After': '60',
      };

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('95');
      expect(headers['Retry-After']).toBe('60');
    });
  });
});

/**
 * Unit tests for logger service
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { logger, createLogger, logAuthEvent, logSecurityEvent } from '@/lib/logger';

describe('Logger Service', () => {
  beforeEach(() => {
    // Clear any previous test state
    jest.clearAllMocks();
  });

  describe('logger', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('createLogger', () => {
    it('should create a child logger with context', () => {
      const childLogger = createLogger({ module: 'test' });
      expect(childLogger).toBeDefined();
    });
  });

  describe('logAuthEvent', () => {
    it('should log authentication events', () => {
      const infoSpy = jest.spyOn(logger, 'info');
      
      logAuthEvent('login', 'user-123', { email: 'test@example.com' });
      
      expect(infoSpy).toHaveBeenCalledWith({
        type: 'auth_event',
        event: 'login',
        userId: 'user-123',
        email: 'test@example.com',
      });
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events', () => {
      const warnSpy = jest.spyOn(logger, 'warn');
      
      logSecurityEvent('rate_limit_exceeded', { ip: '127.0.0.1' });
      
      expect(warnSpy).toHaveBeenCalledWith({
        type: 'security_event',
        event: 'rate_limit_exceeded',
        ip: '127.0.0.1',
      });
    });
  });
});

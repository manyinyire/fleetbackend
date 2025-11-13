/**
 * Redis Client Configuration
 *
 * Provides a singleton Redis client for caching and rate limiting.
 * Falls back gracefully if Redis is not available.
 */

import Redis from 'ioredis';
import { apiLogger } from './logger';
import { env } from './env';

let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Initialize Redis connection
 * Returns null if Redis is not configured or connection fails
 */
export function getRedisClient(): Redis | null {
  // Return existing client if already initialized
  if (redisClient !== null) {
    return redisClient;
  }

  // Check if Redis URL is configured
  if (!env.REDIS_URL || env.REDIS_URL === 'redis://localhost:6379') {
    apiLogger.info('Redis not configured, using in-memory storage for rate limiting');
    return null;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Handle connection events
    redisClient.on('connect', () => {
      apiLogger.info('Redis connected successfully');
      redisAvailable = true;
    });

    redisClient.on('error', (error) => {
      apiLogger.error({ error }, 'Redis connection error');
      redisAvailable = false;
    });

    redisClient.on('ready', () => {
      apiLogger.info('Redis client ready');
      redisAvailable = true;
    });

    redisClient.on('close', () => {
      apiLogger.warn('Redis connection closed');
      redisAvailable = false;
    });

    // Connect to Redis
    redisClient.connect().catch((error) => {
      apiLogger.error({ error }, 'Failed to connect to Redis');
      redisClient = null;
      redisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    apiLogger.error({ error }, 'Failed to initialize Redis client');
    redisClient = null;
    redisAvailable = false;
    return null;
  }
}

/**
 * Check if Redis is available and ready
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null && redisClient.status === 'ready';
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisAvailable = false;
    apiLogger.info('Redis connection closed');
  }
}

// Initialize Redis client on import
getRedisClient();

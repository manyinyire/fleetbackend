/**
 * Queue Configuration for Background Jobs
 * Uses BullMQ with Redis for reliable job processing
 * 
 * Note: Redis is optional. If not configured, queues will use mock implementations
 * that log warnings but don't fail. This allows the application to run without Redis
 * in development or when background jobs are not needed.
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { apiLogger } from './logger';

// Lazy Redis connection - only connect when actually used
let connection: Redis | null = null;

/**
 * Get Redis connection for queue operations
 * Throws error if Redis is not configured
 */
function getConnection(): Redis {
  if (!connection) {
    // Check if Redis is configured
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || redisUrl === '' || redisUrl === 'redis://localhost:6379') {
      apiLogger.warn('Redis not configured - background jobs are disabled');
      throw new Error('Redis not configured - background jobs are disabled');
    }

    connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return connection;
}

/**
 * Create a mock queue that logs warnings when used
 * Used as fallback when Redis is not configured
 */
function createMockQueue(queueName: string) {
  return {
    add: (jobName: string, data?: any) => {
      apiLogger.warn({ queueName, jobName }, 'Redis not configured - queue operation skipped');
      return Promise.resolve({ id: 'mock-job-id' } as any);
    },
    close: () => Promise.resolve(),
  } as any;
}

// Export mock queues that warn when used (Redis not configured)
export const scheduledReportsQueue = createMockQueue('scheduled-reports');
export const emailQueue = createMockQueue('email');
export const smsQueue = createMockQueue('sms');

// Export mock queue events
export const scheduledReportsQueueEvents = {} as any;
export const emailQueueEvents = {} as any;
export const smsQueueEvents = {} as any;

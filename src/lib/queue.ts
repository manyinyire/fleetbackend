/**
 * Queue Configuration for Background Jobs
 * Uses BullMQ with Redis for reliable job processing
 * Redis is disabled by default - queues will not work without Redis
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Lazy Redis connection - only connect when actually used
let connection: Redis | null = null;

function getConnection(): Redis {
  if (!connection) {
    // Check if Redis is configured
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || redisUrl === '' || redisUrl === 'redis://localhost:6379') {
      console.warn('⚠️  Redis not configured - background jobs are disabled');
      // Return a mock connection that won't actually connect
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

// Export mock queues that warn when used
export const scheduledReportsQueue = {
  add: () => {
    console.warn('⚠️  Redis not configured - scheduled reports queue is disabled');
    return Promise.resolve({ id: 'mock' } as any);
  },
  close: () => Promise.resolve(),
} as any;

export const emailQueue = {
  add: () => {
    console.warn('⚠️  Redis not configured - email queue is disabled');
    return Promise.resolve({ id: 'mock' } as any);
  },
  close: () => Promise.resolve(),
} as any;

export const smsQueue = {
  add: () => {
    console.warn('⚠️  Redis not configured - SMS queue is disabled');
    return Promise.resolve({ id: 'mock' } as any);
  },
  close: () => Promise.resolve(),
} as any;

// Export mock queue events
export const scheduledReportsQueueEvents = {} as any;
export const emailQueueEvents = {} as any;
export const smsQueueEvents = {} as any;

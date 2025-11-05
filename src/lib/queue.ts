/**
 * Queue Configuration for Background Jobs
 * Uses BullMQ with Redis for reliable job processing
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Redis connection configuration
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

/**
 * Scheduled Reports Queue
 * Handles generation and delivery of scheduled reports
 */
export const scheduledReportsQueue = new Queue('scheduled-reports', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

/**
 * Email Queue
 * Handles email sending for notifications and reports
 */
export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
  },
});

/**
 * SMS Queue
 * Handles SMS notifications
 */
export const smsQueue = new Queue('sms', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
  },
});

// Queue Events for monitoring
export const scheduledReportsQueueEvents = new QueueEvents('scheduled-reports', { connection });
export const emailQueueEvents = new QueueEvents('email', { connection });
export const smsQueueEvents = new QueueEvents('sms', { connection });

// Cleanup on process exit
process.on('SIGTERM', async () => {
  await scheduledReportsQueue.close();
  await emailQueue.close();
  await smsQueue.close();
  await connection.quit();
});

/**
 * Scheduled Reports Worker
 * Processes scheduled report generation jobs from the queue
 */

import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { reportGeneratorService } from '@/services/report-generator.service';
import { emailQueue } from '@/lib/queue';
import { ReportRunStatus, SubscriptionPlan } from '@prisma/client';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

interface ScheduledReportJob {
  scheduledReportId: string;
  tenantId: string;
}

/**
 * Worker for processing scheduled reports
 */
export const scheduledReportsWorker = new Worker<ScheduledReportJob>(
  'scheduled-reports',
  async (job: Job<ScheduledReportJob>) => {
    const { scheduledReportId, tenantId } = job.data;

    console.log(`Processing scheduled report: ${scheduledReportId}`);

    // Create report run record
    const reportRun = await prisma.reportRun.create({
      data: {
        scheduledReportId,
        status: ReportRunStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      // Get scheduled report details
      const scheduledReport = await prisma.scheduledReport.findUnique({
        where: { id: scheduledReportId },
        include: {
          tenant: true,
        },
      });

      if (!scheduledReport) {
        throw new Error('Scheduled report not found');
      }

      // Check if tenant has PREMIUM plan
      if (scheduledReport.tenant.plan !== SubscriptionPlan.PREMIUM) {
        throw new Error('Scheduled reports are only available for PREMIUM plan');
      }

      // Generate report data
      const reportData = await reportGeneratorService.generateReport(
        tenantId,
        scheduledReport.reportType,
        scheduledReport.filters as Record<string, any>
      );

      // Export report to specified formats
      const fileUrls = await reportGeneratorService.exportReport(
        reportData,
        scheduledReport.format
      );

      // Update report run with success
      await prisma.reportRun.update({
        where: { id: reportRun.id },
        data: {
          status: ReportRunStatus.COMPLETED,
          completedAt: new Date(),
          fileUrls,
        },
      });

      // Update scheduled report last run time
      await prisma.scheduledReport.update({
        where: { id: scheduledReportId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: calculateNextRunTime(
            scheduledReport.frequency,
            new Date()
          ),
        },
      });

      // Send email with report attachments
      await emailQueue.add('send-scheduled-report', {
        to: scheduledReport.recipients,
        subject: `${scheduledReport.name} - ${new Date().toLocaleDateString()}`,
        reportName: scheduledReport.name,
        reportDescription: scheduledReport.description,
        fileUrls,
        tenantId,
      });

      console.log(`Successfully processed scheduled report: ${scheduledReportId}`);

      return {
        success: true,
        reportRunId: reportRun.id,
        fileUrls,
      };
    } catch (error) {
      console.error(`Error processing scheduled report: ${scheduledReportId}`, error);

      // Update report run with failure
      await prisma.reportRun.update({
        where: { id: reportRun.id },
        data: {
          status: ReportRunStatus.FAILED,
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 60000, // 10 reports per minute
    },
  }
);

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(frequency: string, currentDate: Date): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setDate(next.getDate() + 1); // Default to daily
  }

  // Set to start of day (e.g., 9 AM)
  next.setHours(9, 0, 0, 0);

  return next;
}

// Event handlers
scheduledReportsWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

scheduledReportsWorker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

scheduledReportsWorker.on('error', (error) => {
  console.error('Worker error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await scheduledReportsWorker.close();
  await connection.quit();
});

export default scheduledReportsWorker;

import { NextRequest, NextResponse } from 'next/server';
import { invoiceReminderService } from '@/lib/invoice-reminder';
import { apiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await invoiceReminderService.scheduleReminders();

    return NextResponse.json({ 
      message: 'Invoice reminders processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Invoice reminders cron job failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
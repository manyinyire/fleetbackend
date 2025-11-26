# Cron Job Setup Guide

This guide explains how to set up the necessary cron jobs for the Fleet Management System.

## Prerequisites

1. Ensure your application is running and accessible.
2. Ensure you have a `CRON_SECRET` set in your `.env` file.
   ```env
   CRON_SECRET="your-secure-random-string"
   ```

## Required Cron Jobs

The system requires the following cron jobs to be scheduled:

| Job Name | Frequency | Endpoint | Description |
|----------|-----------|----------|-------------|
| Invoice Reminders | Daily at 9:00 AM | `/api/cron/invoice-reminders` | Sends email reminders for upcoming and overdue invoices |
| Weekly Targets | Sunday at 00:01 AM | `/api/cron/weekly-targets` | Closes previous week's targets and prepares for the new week |
| Subscription Validation | Daily at 1:00 AM | `/api/cron/subscription-validation` | Checks for expired subscriptions and updates status |
| Auto Invoice Generation | Monthly (1st) at 2:00 AM | `/api/cron/auto-invoice-generation` | Generates invoices for the new billing period |

## Setup Instructions

### Option 1: Using Linux Crontab (Recommended for VPS/EC2)

1. Open your crontab:
   ```bash
   crontab -e
   ```

2. Add the following lines (replace `https://your-domain.com` and `YOUR_CRON_SECRET`):

   ```bash
   # Invoice Reminders - Daily at 9:00 AM
   0 9 * * * curl -X POST https://your-domain.com/api/cron/invoice-reminders -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/cron-invoices.log 2>&1

   # Weekly Targets - Sunday at 00:01 AM
   1 0 * * 0 curl -X POST https://your-domain.com/api/cron/weekly-targets -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/cron-targets.log 2>&1

   # Subscription Validation - Daily at 1:00 AM
   0 1 * * * curl -X POST https://your-domain.com/api/cron/subscription-validation -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/cron-subs.log 2>&1

   # Auto Invoice Generation - Monthly on 1st at 2:00 AM
   0 2 1 * * curl -X POST https://your-domain.com/api/cron/auto-invoice-generation -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/cron-auto-inv.log 2>&1
   ```

### Option 2: Using Vercel Cron (If deploying to Vercel)

1. Create or update `vercel.json` in your project root:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/invoice-reminders",
         "schedule": "0 9 * * *"
       },
       {
         "path": "/api/cron/weekly-targets",
         "schedule": "1 0 * * 0"
       },
       {
         "path": "/api/cron/subscription-validation",
         "schedule": "0 1 * * *"
       },
       {
         "path": "/api/cron/auto-invoice-generation",
         "schedule": "0 2 1 * *"
       }
     ]
   }
   ```

2. Vercel automatically secures these endpoints, but you should still check for `CRON_SECRET` if you want to support manual invocation.

### Option 3: Using Windows Task Scheduler (For local development/Windows Server)

You can use PowerShell to invoke the endpoints. Create a scheduled task that runs:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/cron/invoice-reminders" -Method Post -Headers @{Authorization=("Bearer " + $env:CRON_SECRET)}
```

## Testing Cron Jobs manually

You can manually trigger any cron job using the API reference or curl:

```bash
curl -X POST http://localhost:3000/api/cron/invoice-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

# Environment Variables Reference

This document describes all environment variables used in the Azaire Fleet Manager application.

## 🔴 Required Variables

These must be set for the application to run:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `BETTER_AUTH_SECRET` | Secret key for BetterAuth encryption | Generate with: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL for authentication | `http://localhost:3000` or `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `http://localhost:3000` or `https://yourdomain.com` |

## 🟡 Platform Settings (Database Fallbacks)

These are used as fallbacks when creating initial platform settings. Once platform settings exist in the database, they're managed through the Super Admin UI:

| Variable | Description | Default | Managed In |
|----------|-------------|---------|------------|
| `PLATFORM_NAME` | Platform name | `Azaire Fleet Manager` | Super Admin UI |
| `DEFAULT_TIMEZONE` | Default timezone | `Africa/Harare` | Super Admin UI |
| `DEFAULT_CURRENCY` | Default currency | `USD` | Super Admin UI |
| `WEBHOOK_URL` | Webhook for system alerts | Empty | Super Admin UI |

## 📧 Email Configuration

Choose **ONE** email provider:

### Option 1: SMTP (Gmail, SendGrid, etc.)

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS/SSL | `false` (for 587) or `true` (for 465) |
| `SMTP_USER` | SMTP username/email | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password/app password | `your-app-password` |
| `SMTP_FROM_NAME` | Display name for emails | `Azaire Fleet Manager` |

### Option 2: Resend (Recommended)

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | `re_xxxxxxxxxx` |

**Get API key:** https://resend.com

## 💳 Payment Gateway (PayNow)

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYNOW_INTEGRATION_ID` | PayNow integration ID | `12345` |
| `PAYNOW_INTEGRATION_KEY` | PayNow integration key | `your-key-here` |
| `PAYNOW_RESULT_URL` | Webhook callback URL | `https://yourdomain.com/api/payments/paynow/callback` |
| `PAYNOW_RETURN_URL` | User return URL | `https://yourdomain.com/payments/result` |

**Get credentials:** https://paynow.co.zw

## 📱 SMS Service (Africa's Talking)

| Variable | Description | Example |
|----------|-------------|---------|
| `AFRICAS_TALKING_API_KEY` | Africa's Talking API key | `your-api-key` |
| `AFRICAS_TALKING_USERNAME` | Africa's Talking username | `your-username` |

**Get credentials:** https://africastalking.com

## 📊 Analytics

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID | `G-XXXXXXXXXX` |

**Get ID:** https://analytics.google.com

## ☁️ Cloud Storage (AWS S3)

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `azaire-files` |

## 🔄 Background Jobs (Redis)

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

## 🛠️ Development

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |

## 🔒 Security Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use strong secrets** - Generate `BETTER_AUTH_SECRET` with: `openssl rand -base64 32`
3. **Rotate secrets regularly** - Especially in production
4. **Use different values** - For development, staging, and production
5. **Restrict access** - Only trusted team members should have access to production env vars

## 🚀 Quick Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Generate `BETTER_AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

3. Fill in required variables (database, auth, app URL)

4. Add optional services as needed (email, payments, etc.)

5. For production, use a secure secret management system (AWS Secrets Manager, Vercel Environment Variables, etc.)

## 📝 Platform Settings Management

**Important:** Most platform configuration is now stored in the database (`PlatformSettings` table) and managed through the Super Admin UI at `/superadmin/settings`.

Environment variables listed under "Platform Settings" are only used as fallbacks when:
- Creating initial platform settings (if none exist)
- During first-time setup

After initial setup, modify platform settings through the Super Admin UI rather than environment variables.


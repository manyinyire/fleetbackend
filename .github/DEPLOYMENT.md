# Deployment Guide

This document describes the CI/CD setup and deployment procedures for the Azaire Fleet Manager application.

## Table of Contents

- [Overview](#overview)
- [CI/CD Workflows](#cicd-workflows)
- [Environment Setup](#environment-setup)
- [Deployment Process](#deployment-process)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses GitHub Actions for CI/CD with the following workflows:

- **CI Workflow** (`ci.yml`): Runs tests, linting, type checking, and builds
- **Deploy Workflow** (`deploy.yml`): Deploys to production server via SSH
- **Rollback Workflow** (`rollback.yml`): Restores from database backup

## CI/CD Workflows

### Continuous Integration (CI)

**Trigger:** Push to \`main\`, \`develop\`, or \`claude/**\` branches, and pull requests

**Jobs:**
1. **Lint & Type Check** - ESLint and TypeScript validation
2. **Test** - Run test suite with PostgreSQL service
3. **Build** - Verify Next.js production build
4. **Docker Build** - Test Docker image build
5. **Security Scan** - npm audit and sensitive file check

### Continuous Deployment (CD)

**Trigger:** Push to \`main\` branch (automatic) or manual via workflow dispatch

**Steps:**
1. Database backup creation
2. Environment validation
3. Code deployment
4. Database migrations
5. Application build
6. PM2 restart
7. Health check verification

### Rollback

**Trigger:** Manual workflow dispatch only

**Requirements:**
- Type "ROLLBACK" to confirm
- Optionally specify backup file

**Steps:**
1. Validation of rollback request
2. Pre-rollback backup creation
3. Database restoration
4. Application restart
5. Health verification

## Environment Setup

### Required GitHub Secrets

Configure these secrets in your repository settings:

| Secret | Description | Example |
|--------|-------------|---------|
| \`SERVER_HOST\` | Production server hostname or IP | \`123.45.67.89\` |
| \`SERVER_USER\` | SSH user for deployment | \`fleet\` |
| \`SSH_PRIVATE_KEY\` | Private SSH key for authentication | (RSA private key) |
| \`SSH_PASSPHRASE\` | Passphrase for SSH key (if applicable) | (passphrase) |
| \`CODECOV_TOKEN\` | Codecov token for coverage reports | (optional) |

### GitHub Environment Protection

It's **strongly recommended** to set up environment protection rules for production deployments.

#### Setting Up Production Environment Protection

1. Go to repository **Settings** → **Environments**
2. Click **New environment** or select **production**
3. Configure protection rules:
   - **Required reviewers:** Add 1-2 reviewers for manual approval
   - **Wait timer:** Optional delay before deployment
   - **Deployment branches:** Restrict to \`main\` only
4. Click **Save protection rules**

## Deployment Process

### Automatic Deployment

Merge to main triggers automatic deployment after CI passes.

### Manual Deployment

Use GitHub Actions workflow dispatch or SSH into server and run \`./deploy.sh\`

## Rollback Procedures

### Using GitHub Actions (Recommended)

1. Go to **Actions** → **Rollback Production**
2. Type "ROLLBACK" to confirm
3. Optionally specify backup file
4. Run workflow

### Using Shell Script

SSH into server:
\`\`\`bash
cd /var/www/fleetbackend
./scripts/rollback.sh production
\`\`\`

## Monitoring and Alerts

- Health endpoint: \`GET /api/health\`
- PM2 monitoring: \`pm2 status\`, \`pm2 logs\`
- Backups stored in \`/var/www/fleetbackend/backups/\`
- Last 7 backups retained automatically

## Troubleshooting

Common issues and solutions documented for:
- Migration failures
- Health check failures
- Database backup issues
- SSH connection problems
- Build failures

See full documentation for detailed troubleshooting steps.

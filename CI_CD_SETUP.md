# CI/CD Setup Documentation

## Overview

This document provides comprehensive information about the CI/CD setup for the Azaire Fleet Manager application using GitHub Actions and automated deployment scripts.

## Table of Contents

- [Architecture](#architecture)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Deployment Scripts](#deployment-scripts)
- [Environment Setup](#environment-setup)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)

---

## Architecture

### Technology Stack

- **Application**: Next.js 15.1.6 with TypeScript
- **Database**: PostgreSQL 17
- **Cache**: Redis 7
- **ORM**: Prisma 5.22.0
- **Container**: Docker (multi-stage build)
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (GHCR)

### Pipeline Flow

```
┌─────────────┐
│   PR/Push   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         CI Pipeline (ci.yml)        │
├─────────────────────────────────────┤
│ 1. Lint & Type Check                │
│ 2. Run Tests (Jest + Coverage)      │
│ 3. Build Application                │
│ 4. Docker Build Test                │
│ 5. Security Scan                    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│       CD Pipeline (deploy.yml)      │
├─────────────────────────────────────┤
│ 1. Build Docker Image               │
│ 2. Push to GHCR                     │
│ 3. Deploy to Environment            │
│ 4. Run Database Migrations          │
│ 5. Health Check                     │
│ 6. Rollback on Failure              │
└─────────────────────────────────────┘
```

---

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers**:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

**Jobs**:

#### Lint & Type Check
- Runs ESLint for code quality
- Performs TypeScript type checking
- Generates Prisma Client

#### Test
- Sets up PostgreSQL and Redis services
- Runs Jest tests with 70% coverage threshold
- Uploads coverage reports to Codecov

#### Build
- Builds Next.js application
- Verifies build artifacts
- Ensures production-ready build

#### Docker Build Test
- Tests Docker image build process
- Uses build cache for optimization
- Validates Dockerfile configuration

#### Security Scan
- Runs npm audit for vulnerability checking
- Checks for accidentally committed sensitive files

### 2. CD Workflow (`.github/workflows/deploy.yml`)

**Triggers**:
- Push to `main` branch (automatic)
- Manual workflow dispatch with environment selection

**Jobs**:

#### Build & Push
- Builds production Docker image
- Tags with multiple identifiers (branch, SHA, date, latest)
- Pushes to GitHub Container Registry
- Generates build attestation

#### Deploy to Staging
- Triggered on manual dispatch with `staging` environment
- SSH into staging server
- Runs deployment script
- Performs health check

#### Deploy to Production
- Triggered on push to `main`
- Requires manual approval (GitHub environment protection)
- SSH into production server
- Runs deployment script with health checks
- Automatic rollback on failure

---

## Deployment Scripts

### 1. Deploy Script (`scripts/deploy.sh`)

**Purpose**: Main deployment orchestration script

**Usage**:
```bash
./scripts/deploy.sh [environment] [image-tag]
```

**Features**:
- ✅ Database backup before deployment
- ✅ Pull latest Docker image
- ✅ Stop existing containers
- ✅ Run database migrations
- ✅ Start new containers
- ✅ Health check verification
- ✅ Image cleanup

**Example**:
```bash
# Deploy to production
./scripts/deploy.sh production ghcr.io/user/app:main-abc123

# Deploy to staging
./scripts/deploy.sh staging latest
```

### 2. Health Check Script (`scripts/health-check.sh`)

**Purpose**: Verify application health after deployment

**Usage**:
```bash
./scripts/health-check.sh [url] [timeout]
```

**Checks**:
- HTTP endpoint availability
- Database connectivity
- Redis connectivity
- Overall application status

**Example**:
```bash
# Check production
./scripts/health-check.sh https://app.example.com 60

# Check local
./scripts/health-check.sh http://localhost:3000 30
```

### 3. Migration Script (`scripts/migrate.sh`)

**Purpose**: Manage database migrations safely

**Usage**:
```bash
./scripts/migrate.sh [environment] [action]
```

**Actions**:
- `deploy` - Deploy migrations to environment
- `status` - Check migration status
- `reset` - Reset database (dev only)
- `create` - Create new migration (dev only)

**Example**:
```bash
# Deploy migrations to production
./scripts/migrate.sh production deploy

# Check status
./scripts/migrate.sh production status

# Create new migration (dev only)
./scripts/migrate.sh development create
```

**Safety Features**:
- 🔒 Production confirmation prompts
- 🔒 Automatic backup before production migrations
- 🔒 Reset disabled in production
- 🔒 Migration status verification

### 4. Rollback Script (`scripts/rollback.sh`)

**Purpose**: Rollback deployment to previous state

**Usage**:
```bash
./scripts/rollback.sh [environment] [backup-file]
```

**Features**:
- Lists available backups
- Interactive backup selection
- Database restoration
- Container restart
- Health verification

**Example**:
```bash
# Interactive rollback
./scripts/rollback.sh production

# Specific backup
./scripts/rollback.sh staging backups/db_backup_staging_20250105.sql.gz
```

---

## Environment Setup

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

#### Production Environment

```bash
# SSH Access
PRODUCTION_HOST=your-server.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=<private-ssh-key>
PRODUCTION_APP_PATH=/opt/azaire-fleet-manager

# Optional: Codecov
CODECOV_TOKEN=<codecov-token>
```

#### Staging Environment

```bash
# SSH Access
STAGING_HOST=staging.your-server.com
STAGING_USER=deploy
STAGING_SSH_KEY=<private-ssh-key>
STAGING_APP_PATH=/opt/azaire-fleet-manager-staging
```

### Required GitHub Variables

Configure these variables in environment settings:

```bash
# Production
PRODUCTION_URL=https://app.example.com

# Staging
STAGING_URL=https://staging.app.example.com
```

### Environment Files

Create environment-specific files on your deployment servers:

#### `.env.production`
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/azaire_prod
REDIS_URL=redis://:password@localhost:6379
BETTER_AUTH_SECRET=<32-char-secret>
BETTER_AUTH_URL=https://app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
SUPER_ADMIN_PASSWORD=<secure-password>
NODE_ENV=production

# Database credentials for docker-compose
DB_USER=azaire_user
DB_PASSWORD=<secure-password>
DB_NAME=azaire_prod
REDIS_PASSWORD=<secure-password>

# Optional services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-password>
# ... other optional configs
```

#### `.env.staging`
Similar to production but with staging-specific values.

### Server Setup

#### Prerequisites

Install on deployment servers:

```bash
# Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# PostgreSQL client (for migrations)
sudo apt-get install postgresql-client

# Node.js (for npm scripts)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Directory Structure

```bash
/opt/azaire-fleet-manager/
├── .env.production
├── docker-compose.production.yml
├── backups/
└── scripts/
    ├── deploy.sh
    ├── health-check.sh
    ├── migrate.sh
    └── rollback.sh
```

#### Permissions

```bash
# Create deployment user
sudo useradd -m -s /bin/bash deploy

# Set up directory
sudo mkdir -p /opt/azaire-fleet-manager
sudo chown -R deploy:deploy /opt/azaire-fleet-manager

# Make scripts executable
chmod +x scripts/*.sh
```

---

## Usage Guide

### Initial Setup

1. **Configure GitHub Secrets**
   - Navigate to repository Settings → Secrets and variables → Actions
   - Add all required secrets for each environment

2. **Set Up Environments**
   - Settings → Environments → New environment
   - Create `production` and `staging` environments
   - Enable required reviewers for production

3. **Prepare Deployment Servers**
   - Install prerequisites
   - Create deployment user
   - Set up directory structure
   - Configure environment files

4. **Grant SSH Access**
   - Add GitHub Actions public key to server's `authorized_keys`
   - Test SSH connection from local machine

### Running CI Pipeline

CI runs automatically on:
- Every push to `main`, `develop`, or `claude/**`
- Every pull request to `main` or `develop`

**Monitor Progress**:
- Go to Actions tab in GitHub
- Click on the latest workflow run
- View job details and logs

### Deploying to Staging

**Option 1: Manual Dispatch**
```bash
# Via GitHub UI
Actions → CD - Deploy to Production → Run workflow
Select: environment = staging
```

**Option 2: SSH Deploy**
```bash
ssh deploy@staging.example.com
cd /opt/azaire-fleet-manager
./scripts/deploy.sh staging latest
```

### Deploying to Production

**Automatic** (on push to main):
```bash
git push origin main
# Wait for CI to pass
# Approve deployment in GitHub (if required)
# Monitor deployment in Actions tab
```

**Manual Deploy**:
```bash
ssh deploy@production.example.com
cd /opt/azaire-fleet-manager
./scripts/deploy.sh production ghcr.io/user/app:main-abc123
```

### Running Migrations

```bash
# SSH into server
ssh deploy@production.example.com
cd /opt/azaire-fleet-manager

# Check migration status
./scripts/migrate.sh production status

# Deploy migrations
./scripts/migrate.sh production deploy
```

### Monitoring Health

```bash
# From local machine
./scripts/health-check.sh https://app.example.com

# From server
./scripts/health-check.sh http://localhost:3000
```

### Performing Rollback

```bash
# SSH into server
ssh deploy@production.example.com
cd /opt/azaire-fleet-manager

# Interactive rollback
./scripts/rollback.sh production

# Or specify backup
./scripts/rollback.sh production backups/db_backup_prod_20250105.sql.gz
```

---

## Troubleshooting

### CI Failures

#### Lint Errors
```bash
# Run locally
npm run lint

# Fix automatically
npx eslint --fix src/
```

#### Type Errors
```bash
# Check types locally
npx tsc --noEmit

# Generate Prisma types
npm run db:generate
```

#### Test Failures
```bash
# Run tests locally
npm test

# Run specific test
npm test -- path/to/test.ts

# Run with coverage
npm run test:coverage
```

### Deployment Failures

#### Docker Image Pull Failed
```bash
# Check image exists
docker pull ghcr.io/user/app:tag

# Re-authenticate
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

#### Migration Failed
```bash
# Check migration status
./scripts/migrate.sh production status

# View migration logs
docker logs azaire-fleet-manager-prod

# Rollback if needed
./scripts/rollback.sh production
```

#### Health Check Failed
```bash
# Check container logs
docker logs azaire-fleet-manager-prod

# Check container status
docker ps -a | grep azaire

# Manual health check
curl http://localhost:3000/api/health

# Check database connection
docker exec -it azaire-postgres-prod psql -U azaire_user -d azaire_prod
```

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose
APP_PORT=3001 docker-compose up
```

#### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Remove old backups
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

#### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs azaire-postgres-prod

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

---

## Best Practices

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   npm test
   npm run lint
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   # Create PR
   ```

2. **Testing**
   - Write tests for new features
   - Maintain 70% coverage threshold
   - Run tests locally before pushing

3. **Code Review**
   - Request reviews from team members
   - Address feedback
   - Ensure CI passes

### Deployment Workflow

1. **Staging First**
   - Deploy to staging before production
   - Test thoroughly in staging
   - Verify migrations

2. **Production Deployment**
   - Schedule during low-traffic periods
   - Have team member monitoring
   - Keep rollback ready

3. **Post-Deployment**
   - Monitor logs for errors
   - Check key metrics
   - Verify critical features

### Security

- 🔒 Never commit `.env` files
- 🔒 Rotate secrets regularly
- 🔒 Use SSH keys, not passwords
- 🔒 Enable GitHub environment protection
- 🔒 Review security audit results
- 🔒 Keep dependencies updated

### Monitoring

- 📊 Set up application monitoring (e.g., Sentry, DataDog)
- 📊 Monitor server resources (CPU, memory, disk)
- 📊 Set up alerts for critical errors
- 📊 Track deployment frequency and success rate

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## Support

For issues or questions:
1. Check this documentation
2. Review GitHub Actions logs
3. Check server logs: `docker logs azaire-fleet-manager-prod`
4. Contact DevOps team

---

**Last Updated**: 2025-01-05
**Version**: 1.0.0

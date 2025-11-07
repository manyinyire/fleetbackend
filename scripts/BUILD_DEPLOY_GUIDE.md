# Pull, Build & Deploy Script Guide

## Overview

The `pull-build-deploy.sh` script automates the process of pulling code from GitHub, checking for database migrations, building the application, and restarting services.

## Quick Start

```bash
# Make script executable (first time only)
chmod +x pull-build-deploy.sh

# Run with default branch (current branch)
./pull-build-deploy.sh

# Run with specific branch
./pull-build-deploy.sh main
./pull-build-deploy.sh develop
```

## What the Script Does

1. **Git Pull** - Pulls the latest code from GitHub
   - Stashes any uncommitted local changes
   - Fetches and pulls from the specified branch
   - Shows what changed (commit diff)

2. **Check Migrations** - Detects pending Prisma migrations
   - Lists any pending migrations
   - Prompts before running migrations (to prevent accidental DB changes)

3. **Install Dependencies** - Updates npm packages
   - Runs `npm ci` for clean install
   - Falls back to `npm install` if needed

4. **Generate Prisma Client** - Updates database client
   - Generates types based on your schema
   - Required after schema changes

5. **Run Migrations** - Applies database changes (if detected)
   - Shows pending migrations
   - Asks for confirmation before running
   - Exits on migration failure

6. **Build Application** - Compiles Next.js app
   - Runs `npm run build`
   - Creates production-optimized build

7. **Restart Services** - Restarts PM2 processes
   - Restarts or starts PM2 application
   - Saves PM2 configuration

8. **Health Check** - Verifies deployment
   - Tests if application is responding
   - Shows status and useful commands

## Configuration

The script uses environment variables that can be customized:

```bash
# Set custom values before running
export APP_DIR="/var/www/fleetbackend"
export APP_USER="fleet"
export LOG_DIR="/var/log/pm2"

# Then run script
./pull-build-deploy.sh
```

Or modify them inline:

```bash
APP_DIR="/custom/path" ./pull-build-deploy.sh
```

## Usage Examples

### Deploy from main branch
```bash
./pull-build-deploy.sh main
```

### Deploy from development branch
```bash
./pull-build-deploy.sh develop
```

### Deploy current branch
```bash
./pull-build-deploy.sh
```

### Custom configuration
```bash
APP_DIR="/opt/myapp" APP_USER="www-data" ./pull-build-deploy.sh
```

## Safety Features

- **Stashes local changes** - Preserves uncommitted work
- **Shows changes before proceeding** - See what will be deployed
- **Confirms migrations** - Prevents accidental database changes
- **Checks for updates** - Option to skip if no changes
- **Health check** - Verifies successful deployment
- **Error handling** - Stops on failures

## Troubleshooting

### Script exits with "No .env file"
Create your environment configuration:
```bash
cp .env.example .env
# Edit .env with your settings
nano .env
```

### Permission denied
Make the script executable:
```bash
chmod +x pull-build-deploy.sh
```

### Git pull fails
Check your Git credentials and network:
```bash
git fetch origin
git status
```

### Build fails
Check Node.js version and dependencies:
```bash
node --version  # Should be v18 or higher
npm --version
npm install --legacy-peer-deps
```

### PM2 not found
Install PM2 globally:
```bash
npm install -g pm2
```

### Application not responding after deploy
Check PM2 logs:
```bash
pm2 logs fleetbackend
pm2 status
```

Check application is bound correctly:
```bash
netstat -tlnp | grep 3000
curl http://localhost:3000
```

## Integration with CI/CD

This script can be integrated with CI/CD pipelines:

### GitHub Actions
```yaml
- name: Deploy Application
  run: |
    cd /var/www/fleetbackend
    ./pull-build-deploy.sh main
```

### Cron Job (Scheduled Deployments)
```bash
# Add to crontab
0 2 * * * cd /var/www/fleetbackend && ./pull-build-deploy.sh main >> /var/log/deploy.log 2>&1
```

### SSH Deployment
```bash
ssh user@server 'cd /var/www/fleetbackend && ./pull-build-deploy.sh main'
```

## Manual Deployment Steps (Without Script)

If you prefer manual control:

```bash
# 1. Pull code
git pull origin main

# 2. Check migrations
npx prisma migrate status

# 3. Install dependencies
npm ci --legacy-peer-deps

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations (if needed)
npx prisma migrate deploy

# 6. Build
npm run build

# 7. Restart
pm2 restart ecosystem.config.js --env production
pm2 save

# 8. Check status
pm2 status
pm2 logs fleetbackend
```

## Related Scripts

- `deploy.sh` - Original deployment script (no git pull)
- `ecosystem.config.js` - PM2 configuration
- `docker-compose.yml` - Docker deployment option

## Best Practices

1. **Test in staging first** - Don't deploy directly to production
2. **Backup database** - Before running migrations
3. **Monitor logs** - After deployment: `pm2 logs fleetbackend`
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use specific branches** - Avoid deploying from feature branches to production

## Support

For issues or questions:
- Check logs: `pm2 logs fleetbackend`
- Check PM2 status: `pm2 status`
- Check build logs: `npm run build`
- Check migrations: `npx prisma migrate status`

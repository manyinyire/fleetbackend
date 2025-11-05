# Deployment Quick Start Guide

This guide will help you quickly set up and deploy the Azaire Fleet Manager application.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ installed
- PostgreSQL client installed
- SSH access to deployment servers (for production/staging)
- GitHub repository access

## 🚀 Quick Setup (5 Minutes)

### 1. Configure GitHub Repository

**Add Secrets** (Settings → Secrets and variables → Actions):

```bash
# Production
PRODUCTION_HOST=your-production-server.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=<your-private-ssh-key>
PRODUCTION_APP_PATH=/opt/azaire-fleet-manager

# Staging
STAGING_HOST=your-staging-server.com
STAGING_USER=deploy
STAGING_SSH_KEY=<your-private-ssh-key>
STAGING_APP_PATH=/opt/azaire-fleet-manager-staging

# Optional
CODECOV_TOKEN=<your-codecov-token>
```

**Add Variables** (Settings → Environments):

Create two environments: `production` and `staging`

- `PRODUCTION_URL`: https://your-domain.com
- `STAGING_URL`: https://staging.your-domain.com

### 2. Set Up Deployment Server

```bash
# SSH into your server
ssh root@your-server.com

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
sudo apt-get install postgresql-client

# Create deployment user
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /opt/azaire-fleet-manager
sudo chown -R deploy:deploy /opt/azaire-fleet-manager

# Switch to deploy user
sudo su - deploy
cd /opt/azaire-fleet-manager
```

### 3. Configure Environment

Create `.env.production` file on the server:

```bash
nano /opt/azaire-fleet-manager/.env.production
```

Add the following (replace with your values):

```env
# Database
DATABASE_URL=postgresql://azaire_user:YOUR_PASSWORD@postgres:5432/azaire_prod
DB_USER=azaire_user
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_NAME=azaire_prod
DB_PORT=5432

# Redis
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@redis:6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_PORT=6379

# Authentication
BETTER_AUTH_SECRET=YOUR_32_CHAR_SECRET_HERE
BETTER_AUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Super Admin
SUPER_ADMIN_PASSWORD=YOUR_SUPER_ADMIN_PASSWORD

# Application
NODE_ENV=production
APP_PORT=3000

# Optional: Email (SMTP or Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=YOUR_APP_PASSWORD
SMTP_FROM_NAME=Azaire Fleet Manager

# Optional: Payment (PayNow)
# PAYNOW_INTEGRATION_ID=
# PAYNOW_INTEGRATION_KEY=
# PAYNOW_RESULT_URL=https://your-domain.com/api/payments/paynow/callback
# PAYNOW_RETURN_URL=https://your-domain.com/payments/result

# Optional: SMS (Africa's Talking)
# AFRICAS_TALKING_API_KEY=
# AFRICAS_TALKING_USERNAME=
```

**Generate secrets**:

```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Generate passwords
openssl rand -base64 16
```

### 4. Copy Required Files to Server

From your local machine:

```bash
# Copy docker-compose file
scp docker-compose.production.yml deploy@your-server:/opt/azaire-fleet-manager/

# Copy deployment scripts
scp -r scripts/ deploy@your-server:/opt/azaire-fleet-manager/

# Make scripts executable (on server)
ssh deploy@your-server "chmod +x /opt/azaire-fleet-manager/scripts/*.sh"
```

### 5. Initial Deployment

**Option A: Via GitHub Actions (Recommended)**

1. Push changes to `main` branch
2. Go to GitHub Actions tab
3. Watch the CI pipeline complete
4. Approve the production deployment (if required)
5. Monitor deployment progress

**Option B: Manual Deployment**

```bash
# SSH into server
ssh deploy@your-server
cd /opt/azaire-fleet-manager

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Run deployment
./scripts/deploy.sh production ghcr.io/YOUR_USERNAME/fleetbackend:latest
```

### 6. Verify Deployment

```bash
# Check health
./scripts/health-check.sh https://your-domain.com

# Check logs
docker logs azaire-fleet-manager-prod

# Check all containers
docker ps
```

## 📊 Common Commands

### Local Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build application
npm run build

# Run with Docker Compose
docker-compose up
```

### Production Management

```bash
# Deploy
./scripts/deploy.sh production [image-tag]

# Check health
./scripts/health-check.sh https://your-domain.com

# View logs
docker logs azaire-fleet-manager-prod -f

# Run migrations
./scripts/migrate.sh production deploy

# Rollback
./scripts/rollback.sh production

# Restart
docker-compose -f docker-compose.production.yml restart
```

### Database Operations

```bash
# Check migration status
./scripts/migrate.sh production status

# Deploy migrations
./scripts/migrate.sh production deploy

# Backup database
docker exec azaire-postgres-prod pg_dump -U azaire_user azaire_prod > backup.sql

# Restore database
docker exec -i azaire-postgres-prod psql -U azaire_user azaire_prod < backup.sql
```

## 🔒 Security Checklist

- [ ] All environment variables are set
- [ ] Strong passwords generated (min 16 characters)
- [ ] SSH key authentication configured
- [ ] Firewall rules configured
- [ ] SSL certificate installed (use Certbot/Let's Encrypt)
- [ ] GitHub secrets added
- [ ] Super admin password changed from default
- [ ] Database backups scheduled
- [ ] Monitoring alerts configured

## 🐛 Troubleshooting

### Application won't start

```bash
# Check logs
docker logs azaire-fleet-manager-prod

# Check environment variables
docker exec azaire-fleet-manager-prod env | grep DATABASE

# Restart containers
docker-compose -f docker-compose.production.yml restart
```

### Database connection errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs azaire-postgres-prod

# Test connection
docker exec -it azaire-postgres-prod psql -U azaire_user -d azaire_prod -c "SELECT 1"
```

### Migration failures

```bash
# Check migration status
./scripts/migrate.sh production status

# View migration logs
docker logs azaire-fleet-manager-prod | grep prisma

# Rollback to previous state
./scripts/rollback.sh production
```

### Health check fails

```bash
# Check container status
docker ps -a

# Check health endpoint directly
curl http://localhost:3000/api/health

# Check nginx/reverse proxy (if applicable)
sudo nginx -t
sudo systemctl status nginx
```

## 📚 Additional Setup

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/azaire`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/azaire /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Automated Backups

Create `/etc/cron.daily/backup-azaire`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/azaire-fleet-manager/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec azaire-postgres-prod pg_dump -U azaire_user azaire_prod | gzip > "$BACKUP_DIR/daily_backup_$DATE.sql.gz"

# Keep only last 7 days
find "$BACKUP_DIR" -name "daily_backup_*.sql.gz" -mtime +7 -delete
```

Make executable:

```bash
sudo chmod +x /etc/cron.daily/backup-azaire
```

## 🎯 Next Steps

1. ✅ Application deployed and running
2. ✅ SSL certificate configured
3. ✅ Backups scheduled
4. 📊 Set up monitoring (Sentry, DataDog, etc.)
5. 📊 Configure logging aggregation
6. 🔔 Set up alerting for critical errors
7. 📈 Monitor performance metrics
8. 🔐 Regular security audits

## 📞 Support

- **Documentation**: [CI_CD_SETUP.md](./CI_CD_SETUP.md)
- **GitHub Issues**: Report bugs and issues
- **Email**: support@example.com

---

**Need Help?** Check the full [CI/CD Setup Documentation](./CI_CD_SETUP.md) for detailed information.

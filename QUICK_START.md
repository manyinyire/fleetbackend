# Quick Start Deployment Guide

## Prerequisites Checklist
- [ ] VPS with Ubuntu 20.04+ or Debian 11+
- [ ] Domain name pointing to VPS (or use IP address)
- [ ] Root/sudo access
- [ ] At least 2GB RAM (4GB+ recommended)

## Quick Deployment Steps

### 1. Server Setup (5 minutes)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis (optional)
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install PM2
sudo npm install -g pm2
pm2 startup systemd  # Follow the instructions

# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Database Setup (2 minutes)
```bash
sudo -u postgres psql << EOF
CREATE DATABASE fleetbackend;
CREATE USER fleetuser WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE fleetbackend TO fleetuser;
ALTER DATABASE fleetbackend OWNER TO fleetuser;
\q
EOF
```

### 3. Application Setup (10 minutes)
```bash
# Create app directory
sudo mkdir -p /var/www/fleetbackend
sudo chown $USER:$USER /var/www/fleetbackend
cd /var/www/fleetbackend

# Clone or upload your code
# For PRIVATE repositories, see DEPLOYMENT.md Section 3.2 for SSH keys setup
git clone YOUR_REPO_URL .
# OR upload files via SCP/SFTP
# OR use: ./setup-git-deploy-key.sh (helper script for private repos)

# Install dependencies
npm ci --only=production --ignore-scripts
npx prisma generate

# Create .env file
cp .env.example .env
nano .env  # Edit with your settings

# Required .env variables:
# DATABASE_URL=postgresql://fleetuser:password@localhost:5432/fleetbackend
# BETTER_AUTH_SECRET=$(openssl rand -base64 32)
# BETTER_AUTH_URL=https://yourdomain.com
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
# NEXTAUTH_URL=https://yourdomain.com

# Run migrations
npx prisma migrate deploy

# Build application
npm run build
```

### 4. PM2 Setup (2 minutes)
```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start application
pm2 start ecosystem.config.js --env production
pm2 save
```

### 5. Nginx Setup (3 minutes)
```bash
# Copy and configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/fleetbackend
sudo nano /etc/nginx/sites-available/fleetbackend
# Replace 'yourdomain.com' with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/fleetbackend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Optional

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Configure firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 6. SSL Setup (5 minutes - Optional but Recommended)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 7. Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs fleetbackend

# Test application
curl http://localhost:3000

# Visit in browser
# http://yourdomain.com or https://yourdomain.com
```

## Common Commands

### Application Management
```bash
pm2 restart fleetbackend    # Restart app
pm2 stop fleetbackend       # Stop app
pm2 logs fleetbackend       # View logs
pm2 monit                   # Monitor app
```

### Database Management
```bash
cd /var/www/fleetbackend
npx prisma migrate deploy  # Run migrations
npx prisma studio          # Open database GUI
```

### Nginx Management
```bash
sudo nginx -t              # Test config
sudo systemctl reload nginx # Reload config
sudo systemctl restart nginx # Restart Nginx
```

### Update Application
```bash
cd /var/www/fleetbackend
git pull                   # Pull latest code
npm ci --only=production --ignore-scripts
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart fleetbackend
```

## Troubleshooting

**Application won't start:**
```bash
pm2 logs fleetbackend
cat .env  # Check environment variables
```

**Nginx 502 error:**
```bash
pm2 status  # Check if app is running
curl http://localhost:3000  # Test app directly
sudo tail -f /var/log/nginx/fleetbackend-error.log
```

**Database connection issues:**
```bash
sudo systemctl status postgresql
psql -U fleetuser -d fleetbackend -h localhost
```

## Next Steps

1. Create super admin: `npm run reset:superadmin`
2. Configure email service in `.env`
3. Set up automated backups
4. Configure monitoring
5. Review security settings

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)


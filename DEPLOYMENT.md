# VPS Deployment Guide - Azaire Fleet Manager

This guide will help you deploy the Azaire Fleet Manager application on a VPS using PM2 and Nginx.

## Prerequisites

- A VPS with Ubuntu 20.04+ or Debian 11+ (recommended: 2GB RAM minimum, 4GB+ preferred)
- Root or sudo access
- Domain name pointing to your VPS IP (optional but recommended)
- Basic knowledge of Linux command line

## Step 1: Initial Server Setup

### 1.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Create Application User

```bash
# Create a non-root user for the application
sudo adduser --disabled-password --gecos "" fleetapp
sudo usermod -aG sudo fleetapp

# Switch to the new user
su - fleetapp
```

## Step 2: Install Required Software

### 2.1 Install Node.js (v20)

```bash
# Install Node.js 20.x using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 2.2 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE fleetmanager;
CREATE USER fleetdb WITH ENCRYPTED PASSWORD 'Fleetzw$$$2dfwefwefwef22';
GRANT ALL PRIVILEGES ON DATABASE fleetmanager TO fleetdb;
ALTER DATABASE fleetmanager OWNER TO fleetdb;
\q
EOF

# Note: Replace 'your_secure_password_here' with a strong password
```

### 2.3 Install Redis (Optional but Recommended)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

### 2.4 Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the instructions shown (usually run a sudo command)
```

### 2.5 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx


sudo systemctl start nginx
sudo systemctl enable nginx


sudo systemctl status nginx
```

## Step 3: Deploy Application

### 3.1 Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/fleetbackend
sudo chown fleetapp:fleetapp /var/www/fleetbackend

# Navigate to the directory
cd /var/www/fleetbackend
```

### 3.2 Clone Repository (or upload files)

**Option A: Using Git with Private Repository**

If your repository is private, you have several options:

#### Method 1: SSH Keys (Recommended for Private Repos)

```bash
# Install Git if not already installed
sudo apt install -y git

# Generate SSH key on the server (if you don't have one)
ssh-keygen -t ed25519 -C "fleetapp@your-server" -f ~/.ssh/id_ed25519
# Press Enter to accept default location
# Optionally set a passphrase (recommended for security)

# Display the public key
cat ~/.ssh/id_ed25519.pub

# Copy the output and add it to your GitHub/GitLab account:
# GitHub: Settings > SSH and GPG keys > New SSH key
# GitLab: Settings > SSH Keys
# Bitbucket: Personal settings > SSH keys

# Test SSH connection
ssh -T git@github.com  # For GitHub
# or
ssh -T git@gitlab.com  # For GitLab

# Clone using SSH
git clone git@github.com:yourusername/fleetbackend.git .
# or
git clone git@gitlab.com:yourusername/fleetbackend.git .
```

#### Method 2: Personal Access Token (HTTPS)

```bash
# Install Git if not already installed
sudo apt install -y git

# Clone using HTTPS with token (GitHub)
# Create a Personal Access Token: GitHub Settings > Developer settings > Personal access tokens
# Select scopes: repo (full control of private repositories)
git clone https://YOUR_TOKEN@github.com/yourusername/fleetbackend.git .

# Or use Git Credential Helper to store credentials
git config --global credential.helper store
git clone https://github.com/yourusername/fleetbackend.git .
# Enter username and token when prompted

# For GitLab
git clone https://oauth2:YOUR_TOKEN@gitlab.com/yourusername/fleetbackend.git .
```

#### Method 3: Deploy Key (Most Secure for Servers)

```bash
# Generate a deploy key (read-only access)
ssh-keygen -t ed25519 -C "deploy-key" -f ~/.ssh/deploy_key
# Press Enter to accept default location
# Do NOT set a passphrase for deploy keys

# Display the public key
cat ~/.ssh/deploy_key.pub

# Add this key as a Deploy Key in your repository:
# GitHub: Repository Settings > Deploy keys > Add deploy key
# GitLab: Repository Settings > Repository > Deploy Keys
# Bitbucket: Repository Settings > Access keys

# Configure SSH to use the deploy key
cat >> ~/.ssh/config << EOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/deploy_key
    IdentitiesOnly yes
EOF

# Set correct permissions
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/deploy_key

# Test connection
ssh -T git@github.com

# Clone the repository
git clone git@github.com:yourusername/fleetbackend.git .
```

**Option B: Upload Files via SCP/SFTP**

If you prefer not to use Git on the server:

```bash
# From your local machine, upload files using SCP
scp -r . fleetapp@your-server-ip:/var/www/fleetbackend/

# Or use SFTP
sftp fleetapp@your-server-ip
put -r . /var/www/fleetbackend/

# Or use rsync (more efficient for updates)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  . fleetapp@your-server-ip:/var/www/fleetbackend/
```

### 3.3 Install Dependencies

```bash
cd /var/www/fleetbackend

# Install production dependencies
npm ci --only=production --ignore-scripts

# Generate Prisma Client
npx prisma generate
```

### 3.4 Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Required variables to set:**
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL`: Your domain URL (e.g., `https://yourdomain.com`)
- `NEXT_PUBLIC_APP_URL`: Your domain URL
- `NEXTAUTH_URL`: Your domain URL

**Example .env file:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://fleetdb:Fleetzw$$$2dfwefwefwef22@localhost:5432/fleetmanager
BETTER_AUTH_SECRET=your-generated-secret-here
BETTER_AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

**Note:** Make sure to update the `DATABASE_URL` to match your database credentials from Step 2.2.

### 3.5 Run Database Migrations

```bash
# Run Prisma migrations
npx prisma migrate deploy

# (Optional) Seed the database
npm run db:seed
```

### 3.6 Build the Application

```bash
# Build Next.js application
npm run build
```

## Step 4: Configure PM2

### 4.1 Update PM2 Configuration

```bash
# Edit the ecosystem.config.js file
nano ecosystem.config.js

# Update the following:
# - cwd: Should point to /var/www/fleetbackend
# - env_production: Ensure NODE_ENV is set to 'production'
```

### 4.2 Create PM2 Log Directory

```bash
sudo mkdir -p /var/log/pm2
sudo chown fleetapp:fleetapp /var/log/pm2
```

### 4.3 Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs fleetbackend

# Save PM2 configuration
pm2 save
```

## Step 5: Configure Nginx

### 5.1 Copy Nginx Configuration

```bash
# Copy the nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/fleetbackend

# Edit the configuration
sudo nano /etc/nginx/sites-available/fleetbackend
```

**Important: Update the following:**
- Replace `yourdomain.com` with your actual domain name
- If you don't have a domain, use your server's IP address

### 5.2 Enable Site

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/fleetbackend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 5.3 Configure Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Check firewall status
sudo ufw status
```

## Step 6: Setup SSL Certificate (Recommended)

### 6.1 Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificate

```bash
# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 6.3 Enable Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

### 6.4 Update Nginx Configuration

After SSL is set up, uncomment the HTTPS server block in `/etc/nginx/sites-available/fleetbackend` and comment out or remove the HTTP-only block.

## Step 7: Verify Deployment

### 7.1 Check Application Status

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs fleetbackend --lines 50

# Check if application is responding
curl http://localhost:3000/api/health
```

### 7.2 Check Nginx Status

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/fleetbackend-access.log
sudo tail -f /var/log/nginx/fleetbackend-error.log
```

### 7.3 Test in Browser

Open your browser and navigate to:
- `http://yourdomain.com` (or `https://yourdomain.com` if SSL is configured)
- Check if the application loads correctly

## Step 8: Post-Deployment Tasks

### 8.1 Create Super Admin User

```bash
cd /var/www/fleetbackend
npm run reset:superadmin
# Follow the prompts to create a super admin account
```

### 8.2 Setup Platform Settings

```bash
cd /var/www/fleetbackend
npm run db:setup
# This will run migrations and seed initial data
```

### 8.3 Configure Optional Services

Update your `.env` file with credentials for:
- Email service (SMTP or Resend)
- Payment gateway (PayNow)
- SMS service (Africa's Talking)
- Cloud storage (AWS S3)
- Analytics (Google Analytics)

## Step 9: Maintenance Commands

### Application Management

```bash
# Restart application
pm2 restart fleetbackend

# Stop application
pm2 stop fleetbackend

# View logs
pm2 logs fleetbackend

# Monitor application
pm2 monit

# Reload application (zero downtime)
pm2 reload fleetbackend
```

### Database Management

```bash
# Run migrations
cd /var/www/fleetbackend
npx prisma migrate deploy

# Open Prisma Studio (for database management)
npx prisma studio
# Access at http://localhost:5555
```

### Nginx Management

```bash
# Reload Nginx (after configuration changes)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx configuration
sudo nginx -t
```

### Update Application

```bash
# Navigate to application directory
cd /var/www/fleetbackend

# Pull latest changes (if using Git)
# For private repos, ensure SSH keys or credentials are set up
git pull origin main
# or
git pull origin master  # If using master branch

# If you get authentication errors, check:
# - SSH keys: ssh -T git@github.com
# - Git credentials: git config --list | grep credential
# - Deploy key permissions

# Install new dependencies
npm ci --only=production --ignore-scripts

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild application
npm run build

# Restart application
pm2 restart fleetbackend
```

### Updating from Private Repository (Alternative Methods)

If you're having issues with Git on the server, you can update from your local machine:

```bash
# From your local machine, sync files to server
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude '.env' \
  . fleetapp@your-server-ip:/var/www/fleetbackend/

# Then SSH into server and run:
ssh fleetapp@your-server-ip
cd /var/www/fleetbackend
npm ci --only=production --ignore-scripts
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart fleetbackend
```

## Troubleshooting

### Application Won't Start

1. Check PM2 logs: `pm2 logs fleetbackend`
2. Check environment variables: `cat .env`
3. Verify database connection: `npx prisma db pull`
4. Check if port 3000 is available: `sudo netstat -tulpn | grep 3000`

### Nginx 502 Bad Gateway

1. Check if application is running: `pm2 status`
2. Check application logs: `pm2 logs fleetbackend`
3. Verify Nginx can reach the application: `curl http://localhost:3000`
4. Check Nginx error logs: `sudo tail -f /var/log/nginx/fleetbackend-error.log`

### Database Connection Issues

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Test database connection: `psql -U fleetdb -d fleetmanager -h localhost`
3. Check database URL in `.env` file (should match credentials from Step 2.2)
4. Verify database user permissions

### Git/Repository Access Issues

1. **SSH Key Issues:**
   ```bash
   # Test SSH connection
   ssh -T git@github.com
   
   # Check SSH key permissions
   ls -la ~/.ssh/
   chmod 600 ~/.ssh/id_ed25519
   chmod 644 ~/.ssh/id_ed25519.pub
   ```

2. **Personal Access Token Issues:**
   ```bash
   # Clear stored credentials
   git config --global --unset credential.helper
   git config --global credential.helper store
   
   # Re-clone with token
   git clone https://YOUR_TOKEN@github.com/yourusername/fleetbackend.git .
   ```

3. **Deploy Key Issues:**
   ```bash
   # Verify deploy key is added to repository
   # Check SSH config
   cat ~/.ssh/config
   
   # Test with specific key
   ssh -i ~/.ssh/deploy_key -T git@github.com
   ```

### SSL Certificate Issues

1. Check certificate status: `sudo certbot certificates`
2. Test renewal: `sudo certbot renew --dry-run`
3. Check Nginx SSL configuration: `sudo nginx -t`

## Security Recommendations

1. **Keep system updated**: `sudo apt update && sudo apt upgrade -y`
2. **Use strong passwords**: For database, application secrets, etc.
3. **Enable firewall**: `sudo ufw enable`
4. **Regular backups**: Set up automated backups for database and application files
5. **Monitor logs**: Regularly check application and server logs
6. **Use SSL**: Always use HTTPS in production
7. **Restrict SSH**: Consider disabling password authentication for SSH
8. **Regular updates**: Keep Node.js, PostgreSQL, and other software updated

## Backup Strategy

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/fleetbackend"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U fleetuser fleetbackend > $BACKUP_DIR/db_backup_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### Application Files Backup

```bash
# Backup application directory
sudo tar -czf /var/backups/fleetbackend/app_backup_$(date +%Y%m%d).tar.gz /var/www/fleetbackend
```

## Monitoring

Consider setting up monitoring tools:
- **PM2 Plus**: `pm2 link` (free tier available)
- **Uptime monitoring**: UptimeRobot, Pingdom, etc.
- **Log aggregation**: Consider using services like Logtail, Papertrail, or self-hosted solutions

## Support

For issues or questions:
1. Check application logs: `pm2 logs fleetbackend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/fleetbackend-error.log`
3. Review this deployment guide
4. Check application documentation

---

**Deployment completed!** Your application should now be accessible at your domain or IP address.


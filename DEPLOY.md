# VPS Deployment Guide - Azaire Fleet Manager

## Prerequisites

Your VPS should already have:
- **Node.js 20+** (`node -v`)
- **PostgreSQL** (running, with a database created)
- **Nginx** (installed and running)
- **PM2** (installed globally: `npm install -g pm2`)
- **Git**

---

## 1. Create PostgreSQL Database

Connect to your existing PostgreSQL and create a database:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE azaire_fleet;
CREATE USER fleetuser WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE azaire_fleet TO fleetuser;
ALTER DATABASE azaire_fleet OWNER TO fleetuser;
\q
```

Your `DATABASE_URL` will be:
```
postgresql://fleetuser:your_strong_password@localhost:5432/azaire_fleet
```

---

## 2. Clone & Setup

```bash
# Clone the repo
sudo mkdir -p /var/www/fleetbackend
sudo chown -R $USER:$USER /var/www/fleetbackend
git clone https://github.com/manyinyire/fleetbackend.git /var/www/fleetbackend
cd /var/www/fleetbackend
```

---

## 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required values to change:**

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://fleetuser:your_strong_password@localhost:5432/azaire_fleet"

# Generate secrets (run each command and paste the output)
# openssl rand -base64 32
BETTER_AUTH_SECRET="<paste-generated-secret>"
NEXTAUTH_SECRET="<paste-generated-secret>"
AUTH_SECRET="<paste-generated-secret>"

# Your domain
BETTER_AUTH_URL="https://fleetmanager.co.zw"
NEXT_PUBLIC_APP_URL="https://fleetmanager.co.zw"
NEXTAUTH_URL="https://fleetmanager.co.zw"

# Production mode
NODE_ENV="production"

# Super admin password for initial seed
SUPER_ADMIN_PASSWORD="YourSecurePassword123!"
```

---

## 4. Install, Migrate & Build

```bash
cd /var/www/fleetbackend

# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (first time only)
npx tsx prisma/seed.ts

# Build Next.js for production
npm run build
```

---

## 5. Start with PM2

```bash
cd /var/www/fleetbackend

# Start the app (2 cluster instances by default)
pm2 start ecosystem.config.js --env production

# Save PM2 process list (survives reboot)
pm2 save

# Setup auto-start on boot
pm2 startup
# Run the command it outputs (starts with sudo env ...)
```

**Verify it's running:**
```bash
pm2 status
pm2 logs fleetbackend
curl http://localhost:3000
```

---

## 6. Configure Nginx

```bash
# Copy the nginx config
sudo cp /var/www/fleetbackend/deploy/nginx.conf /etc/nginx/sites-available/fleetbackend

# Domain is already set to fleetmanager.co.zw
sudo nano /etc/nginx/sites-available/fleetbackend

# Enable the site
sudo ln -s /etc/nginx/sites-available/fleetbackend /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 7. SSL Certificate (Let's Encrypt)

```bash
# Install certbot if not already installed
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d fleetmanager.co.zw

# Auto-renewal is set up automatically, verify with:
sudo certbot renew --dry-run
```

---

## 8. Updating (Future Deployments)

**Option A: Use the deploy script**
```bash
cd /var/www/fleetbackend
bash deploy/deploy.sh
```

**Option B: Manual steps**
```bash
cd /var/www/fleetbackend
git pull origin main
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js --env production
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check app status |
| `pm2 logs fleetbackend` | View application logs |
| `pm2 logs fleetbackend --lines 100` | View last 100 log lines |
| `pm2 monit` | Real-time monitoring |
| `pm2 restart fleetbackend` | Hard restart |
| `pm2 reload fleetbackend` | Zero-downtime reload |
| `pm2 stop fleetbackend` | Stop the app |
| `pm2 delete fleetbackend` | Remove from PM2 |
| `sudo nginx -t` | Test Nginx config |
| `sudo systemctl reload nginx` | Reload Nginx |
| `sudo certbot renew` | Renew SSL certificates |
| `npx prisma studio` | Open database GUI (dev only) |

---

## Troubleshooting

### App won't start
```bash
# Check PM2 logs
pm2 logs fleetbackend --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Try running directly to see errors
cd /var/www/fleetbackend
NODE_ENV=production node node_modules/next/dist/bin/next start
```

### Database connection issues
```bash
# Test PostgreSQL connection
psql "postgresql://fleetuser:your_password@localhost:5432/azaire_fleet"

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check migration status
cd /var/www/fleetbackend
npx prisma migrate status
```

### Nginx 502 Bad Gateway
```bash
# Check if the app is running
pm2 status
curl http://localhost:3000

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Memory issues
```bash
# Check memory usage
free -h
pm2 monit

# Reduce PM2 instances if needed (edit ecosystem.config.js)
# Change instances from 2 to 1
pm2 reload ecosystem.config.js --env production
```

---

## Firewall (if using UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

> **Note:** Port 3000 should NOT be exposed publicly. Nginx handles all external traffic and proxies to the app internally.

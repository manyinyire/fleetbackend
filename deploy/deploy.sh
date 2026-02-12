#!/bin/bash
# =============================================================
# Azaire Fleet Manager - VPS Deployment Script
# =============================================================
# Usage:
#   First deploy:  ./deploy/deploy.sh --setup
#   Update deploy: ./deploy/deploy.sh
# =============================================================

set -e

# Configuration
APP_NAME="fleetbackend"
APP_DIR="/var/www/fleetbackend"
REPO_URL="https://github.com/manyinyire/fleetbackend.git"
BRANCH="main"
NODE_VERSION="20"
LOG_DIR="/var/log/pm2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# -------------------------------------------------------
# First-time setup (run with --setup flag)
# -------------------------------------------------------
setup() {
    log "Starting first-time setup..."

    # Create app directory
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"

    # Create log directory
    sudo mkdir -p "$LOG_DIR"
    sudo chown -R $USER:$USER "$LOG_DIR"

    # Clone repository
    if [ ! -d "$APP_DIR/.git" ]; then
        log "Cloning repository..."
        git clone "$REPO_URL" "$APP_DIR"
    else
        warn "Repository already cloned, pulling latest..."
        cd "$APP_DIR"
        git pull origin "$BRANCH"
    fi

    cd "$APP_DIR"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Install Node.js $NODE_VERSION first:\n  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -\n  sudo apt-get install -y nodejs"
    fi

    log "Node.js version: $(node -v)"
    log "npm version: $(npm -v)"

    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        error "PM2 is not installed. Install with: sudo npm install -g pm2"
    fi

    # Check Nginx
    if ! command -v nginx &> /dev/null; then
        error "Nginx is not installed."
    fi

    # Create .env from example if it doesn't exist
    if [ ! -f "$APP_DIR/.env" ]; then
        log "Creating .env file from .env.example..."
        cp "$APP_DIR/.env.example" "$APP_DIR/.env"
        warn "IMPORTANT: Edit $APP_DIR/.env with your production values before continuing!"
        warn "At minimum, set:"
        warn "  - DATABASE_URL (your PostgreSQL connection string)"
        warn "  - BETTER_AUTH_SECRET (openssl rand -base64 32)"
        warn "  - NEXTAUTH_SECRET (openssl rand -base64 32)"
        warn "  - NEXTAUTH_URL (https://your-domain.com)"
        warn "  - NEXT_PUBLIC_APP_URL (https://your-domain.com)"
        warn "  - BETTER_AUTH_URL (https://your-domain.com)"
        warn "  - NODE_ENV=production"
        echo ""
        warn "Run 'nano $APP_DIR/.env' to edit, then re-run this script without --setup"
        exit 0
    fi

    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false

    # Generate Prisma client
    log "Generating Prisma client..."
    npx prisma generate

    # Run database migrations
    log "Running database migrations..."
    npx prisma migrate deploy

    # Seed database (optional - only on first deploy)
    read -p "Do you want to seed the database? (y/N): " seed_choice
    if [ "$seed_choice" = "y" ] || [ "$seed_choice" = "Y" ]; then
        log "Seeding database..."
        npx tsx prisma/seed.ts
    fi

    # Build the application
    log "Building Next.js application..."
    npm run build

    # Setup Nginx
    log "Setting up Nginx..."
    if [ ! -f "/etc/nginx/sites-available/$APP_NAME" ]; then
        sudo cp "$APP_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/$APP_NAME"
        warn "IMPORTANT: Edit /etc/nginx/sites-available/$APP_NAME and replace fleetmanager.co.zw with your actual domain"
        warn "Then run: sudo ln -s /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/"
    fi

    # Start with PM2
    log "Starting application with PM2..."
    cd "$APP_DIR"
    pm2 start ecosystem.config.js --env production
    pm2 save

    # Setup PM2 startup script
    log "Setting up PM2 startup..."
    pm2 startup | tail -1 | bash 2>/dev/null || warn "Run 'pm2 startup' manually and execute the output command"

    log "========================================="
    log "Setup complete!"
    log "========================================="
    log ""
    log "Next steps:"
    log "  1. Edit /etc/nginx/sites-available/$APP_NAME (replace fleetmanager.co.zw)"
    log "  2. Create symlink: sudo ln -s /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/"
    log "  3. Test Nginx: sudo nginx -t"
    log "  4. Reload Nginx: sudo systemctl reload nginx"
    log "  5. Setup SSL: sudo certbot --nginx -d fleetmanager.co.zw"
    log ""
    log "Useful commands:"
    log "  pm2 status           - Check app status"
    log "  pm2 logs $APP_NAME   - View logs"
    log "  pm2 monit            - Monitor resources"
}

# -------------------------------------------------------
# Regular deployment (git pull + rebuild)
# -------------------------------------------------------
deploy() {
    log "Starting deployment..."

    cd "$APP_DIR" || error "App directory not found. Run with --setup first."

    # Check if .env exists
    [ -f "$APP_DIR/.env" ] || error ".env file not found. Run with --setup first."

    # Pull latest changes
    log "Pulling latest changes..."
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"

    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false

    # Generate Prisma client
    log "Generating Prisma client..."
    npx prisma generate

    # Run database migrations
    log "Running database migrations..."
    npx prisma migrate deploy

    # Build the application
    log "Building Next.js application..."
    npm run build

    # Reload PM2 (zero-downtime)
    log "Reloading PM2 (zero-downtime)..."
    pm2 reload ecosystem.config.js --env production

    log "========================================="
    log "Deployment complete!"
    log "========================================="
    log "Run 'pm2 logs $APP_NAME' to check for errors"
}

# -------------------------------------------------------
# Main
# -------------------------------------------------------
if [ "$1" = "--setup" ]; then
    setup
else
    deploy
fi

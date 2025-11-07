#!/bin/bash

# Pull, Build, and Deploy Script for Azaire Fleet Manager
# This script pulls the latest code from GitHub, checks for migrations,
# builds the application, and restarts services
#
# Usage: ./pull-build-deploy.sh [branch-name]
#        ./pull-build-deploy.sh main  (pulls from main branch)
#        ./pull-build-deploy.sh       (pulls current branch)
#
# First time setup:
#   chmod +x pull-build-deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${APP_DIR:-/var/www/fleetbackend}"
APP_USER="${APP_USER:-fleet}"
LOG_DIR="${LOG_DIR:-/var/log/pm2}"
BRANCH="${1:-$(git branch --show-current)}"

# Function to print colored output
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    log_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 is not installed. Will skip PM2 restart."
    PM2_AVAILABLE=false
else
    PM2_AVAILABLE=true
fi

log_step "Starting Pull, Build & Deploy Process"
log_info "Target branch: ${BRANCH}"
log_info "Application directory: ${APP_DIR}"
log_info "Current user: ${USER}"

# Navigate to application directory
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR" || exit 1
else
    log_error "Application directory does not exist: $APP_DIR"
    log_info "Using current directory: $(pwd)"
fi

# Check if .env exists
if [ ! -f .env ]; then
    log_error ".env file not found!"
    log_info "Please create .env file from .env.example"
    exit 1
fi

# Get current commit hash before pull
log_step "Step 1: Git Pull"
OLD_COMMIT=$(git rev-parse HEAD)
log_info "Current commit: ${OLD_COMMIT:0:8}"

# Stash any local changes
if [[ -n $(git status -s) ]]; then
    log_warning "Uncommitted changes detected. Stashing..."
    git stash save "Auto-stash before pull at $(date)"
fi

# Fetch latest changes
log_info "Fetching from origin..."
git fetch origin

# Pull latest code
log_info "Pulling branch: ${BRANCH}"
if git pull origin "$BRANCH"; then
    log_success "Successfully pulled latest code"
else
    log_error "Failed to pull from GitHub"
    exit 1
fi

# Get new commit hash after pull
NEW_COMMIT=$(git rev-parse HEAD)
log_info "New commit: ${NEW_COMMIT:0:8}"

# Check if there were any changes
if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
    log_warning "No new changes detected. Code is already up to date."
    read -p "Continue with build anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
else
    log_success "Code updated: ${OLD_COMMIT:0:8} → ${NEW_COMMIT:0:8}"
    log_info "Changes:"
    git log --oneline "${OLD_COMMIT}..${NEW_COMMIT}" | head -n 5
fi

# Check for new migrations
log_step "Step 2: Check for Database Migrations"
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "pending migration"; then
    log_warning "Pending migrations detected!"
    echo "$MIGRATION_STATUS"

    # List migration files
    log_info "Migration files found:"
    if [ -d "prisma/migrations" ]; then
        ls -lt prisma/migrations/ | grep "^d" | head -n 5
    fi

    HAS_MIGRATIONS=true
else
    log_success "No pending migrations"
    HAS_MIGRATIONS=false
fi

# Install/update dependencies
log_step "Step 3: Install Dependencies"
log_info "Installing dependencies..."
if npm ci --legacy-peer-deps; then
    log_success "Dependencies installed"
else
    log_warning "npm ci failed, trying npm install..."
    npm install --legacy-peer-deps
fi

# Generate Prisma Client
log_step "Step 4: Generate Prisma Client"
log_info "Generating Prisma Client..."
if npx prisma generate; then
    log_success "Prisma Client generated"
else
    log_error "Failed to generate Prisma Client"
    exit 1
fi

# Run database migrations if detected
if [ "$HAS_MIGRATIONS" = true ]; then
    log_step "Step 5: Run Database Migrations"
    log_warning "About to run database migrations. This will modify the database!"
    read -p "Proceed with migrations? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Running migrations..."
        if npx prisma migrate deploy; then
            log_success "Migrations completed successfully"
        else
            log_error "Migration failed!"
            log_error "Please check the database and fix any issues before proceeding."
            exit 1
        fi
    else
        log_warning "Migrations skipped. Application may not work correctly!"
    fi
else
    log_step "Step 5: Run Database Migrations"
    log_info "No migrations to run"
fi

# Build application
log_step "Step 6: Build Application"
log_info "Building Next.js application..."
if npm run build; then
    log_success "Build completed successfully"
else
    log_error "Build failed!"
    exit 1
fi

# Restart services
log_step "Step 7: Restart Services"

if [ "$PM2_AVAILABLE" = true ]; then
    log_info "Restarting application with PM2..."

    # Check if app is already running
    if pm2 describe fleetbackend &> /dev/null; then
        log_info "Restarting existing PM2 process..."
        pm2 restart ecosystem.config.js --env production
    else
        log_info "Starting new PM2 process..."
        pm2 start ecosystem.config.js --env production
    fi

    # Save PM2 configuration
    pm2 save

    log_success "PM2 restart completed"

    # Show PM2 status
    pm2 status
else
    log_warning "PM2 not available. Skipping service restart."
    log_info "To start the application manually, run:"
    log_info "  npm run start"
fi

# Health check
log_step "Step 8: Health Check"
log_info "Waiting for application to start..."
sleep 5

# Try to reach health endpoint
HEALTH_URL="http://localhost:3000/api/health"
if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
    log_success "✓ Application is running successfully!"
    log_success "Health check passed: $HEALTH_URL"
elif curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
    log_success "✓ Application is responding on http://localhost:3000"
else
    log_warning "⚠ Could not verify application health"
    log_info "This may be normal if the application takes time to start"
    if [ "$PM2_AVAILABLE" = true ]; then
        log_info "Check logs with: pm2 logs fleetbackend"
    fi
fi

# Summary
log_step "Deployment Summary"
echo -e "${GREEN}✓ Code pulled from GitHub (${BRANCH})${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Prisma client generated${NC}"
if [ "$HAS_MIGRATIONS" = true ]; then
    echo -e "${GREEN}✓ Database migrations applied${NC}"
fi
echo -e "${GREEN}✓ Application built${NC}"
if [ "$PM2_AVAILABLE" = true ]; then
    echo -e "${GREEN}✓ Services restarted${NC}"
fi

echo ""
log_success "Deployment completed successfully! 🚀"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
if [ "$PM2_AVAILABLE" = true ]; then
    echo -e "  ${YELLOW}pm2 logs fleetbackend${NC}       - View application logs"
    echo -e "  ${YELLOW}pm2 status${NC}                  - View PM2 status"
    echo -e "  ${YELLOW}pm2 restart fleetbackend${NC}    - Restart application"
    echo -e "  ${YELLOW}pm2 stop fleetbackend${NC}       - Stop application"
fi
echo -e "  ${YELLOW}git log -n 5${NC}                - View recent commits"
echo -e "  ${YELLOW}npx prisma migrate status${NC}  - Check migration status"
echo -e "  ${YELLOW}npm run build${NC}               - Rebuild application"
echo ""

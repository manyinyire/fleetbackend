#!/bin/bash

# Deployment Script for Azaire Fleet Manager
# This script helps automate the deployment process
# Usage: ./deploy.sh
#
# First time setup:
#   chmod +x deploy.sh
#   ./deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/fleetbackend"
APP_USER="fleet"
LOG_DIR="/var/log/pm2"

echo -e "${GREEN}Starting deployment...${NC}"

# Check if running as correct user
if [ "$USER" != "$APP_USER" ]; then
    echo -e "${YELLOW}Warning: Not running as $APP_USER. Some commands may fail.${NC}"
fi

# Navigate to application directory
cd "$APP_DIR" || exit 1

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Install/update dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm ci --only=production --ignore-scripts

# Generate Prisma Client
echo -e "${GREEN}Generating Prisma Client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
npx prisma migrate deploy

# Build application
echo -e "${GREEN}Building application...${NC}"
npm run build

# Restart PM2
echo -e "${GREEN}Restarting application with PM2...${NC}"
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Check application status
echo -e "${GREEN}Checking application status...${NC}"
pm2 status

# Test application
echo -e "${GREEN}Testing application...${NC}"
sleep 3
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is running successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Application may not be responding. Check logs with: pm2 logs fleetbackend${NC}"
fi

echo -e "${GREEN}Deployment completed!${NC}"
echo -e "View logs: ${YELLOW}pm2 logs fleetbackend${NC}"
echo -e "View status: ${YELLOW}pm2 status${NC}"


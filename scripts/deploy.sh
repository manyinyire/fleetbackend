#!/bin/bash

###############################################################################
# Azaire Fleet Manager - Deployment Script
#
# Usage: ./scripts/deploy.sh [environment] [image-tag]
#   environment: production | staging | development
#   image-tag: Docker image tag to deploy (optional, defaults to latest)
#
# Examples:
#   ./scripts/deploy.sh production ghcr.io/user/app:main-abc123
#   ./scripts/deploy.sh staging latest
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check arguments
if [ $# -lt 1 ]; then
    log_error "Environment argument is required"
    echo "Usage: $0 [environment] [image-tag]"
    echo "  environment: production | staging | development"
    echo "  image-tag: Docker image tag (optional, defaults to latest)"
    exit 1
fi

ENVIRONMENT=$1
IMAGE_TAG=${2:-"latest"}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: production, staging, development"
    exit 1
fi

log_info "Starting deployment to ${ENVIRONMENT} environment..."
log_info "Image tag: ${IMAGE_TAG}"

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Function to create database backup
backup_database() {
    log_info "Creating database backup..."

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="${BACKUP_DIR}/db_backup_${ENVIRONMENT}_${TIMESTAMP}.sql"

    if [ -f ".env.${ENVIRONMENT}" ]; then
        # Load database URL from environment file
        set -a
        source ".env.${ENVIRONMENT}"
        set +a

        if [ -n "${DATABASE_URL:-}" ]; then
            # Extract database connection details
            DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
            if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
                DB_USER="${BASH_REMATCH[1]}"
                DB_PASS="${BASH_REMATCH[2]}"
                DB_HOST="${BASH_REMATCH[3]}"
                DB_PORT="${BASH_REMATCH[4]}"
                DB_NAME="${BASH_REMATCH[5]}"

                PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

                if [ $? -eq 0 ]; then
                    log_success "Database backup created: ${BACKUP_FILE}"

                    # Compress backup
                    gzip "$BACKUP_FILE"
                    log_success "Backup compressed: ${BACKUP_FILE}.gz"
                else
                    log_warning "Database backup failed, continuing with deployment..."
                fi
            else
                log_warning "Could not parse DATABASE_URL, skipping backup"
            fi
        else
            log_warning "DATABASE_URL not found, skipping backup"
        fi
    else
        log_warning "Environment file not found: .env.${ENVIRONMENT}"
        log_warning "Skipping database backup"
    fi
}

# Function to pull latest Docker image
pull_image() {
    log_info "Pulling Docker image: ${IMAGE_TAG}..."

    if docker pull "$IMAGE_TAG"; then
        log_success "Image pulled successfully"
    else
        log_error "Failed to pull Docker image"
        exit 1
    fi
}

# Function to stop existing containers
stop_containers() {
    log_info "Stopping existing containers..."

    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" down
        log_success "Containers stopped"
    else
        log_warning "Compose file not found: ${COMPOSE_FILE}"
        log_info "Attempting to stop containers by project name..."
        docker-compose -p azaire-fleet-manager down || true
    fi
}

# Function to run database migrations
run_migrations() {
    log_info "Running database migrations..."

    # Load environment variables
    if [ -f ".env.${ENVIRONMENT}" ]; then
        set -a
        source ".env.${ENVIRONMENT}"
        set +a
    fi

    # Run migrations using Docker
    if command -v docker &> /dev/null; then
        docker run --rm \
            -v "$(pwd)/prisma:/app/prisma" \
            -e DATABASE_URL="${DATABASE_URL}" \
            "$IMAGE_TAG" \
            npx prisma migrate deploy

        if [ $? -eq 0 ]; then
            log_success "Migrations completed successfully"
        else
            log_error "Migration failed"
            exit 1
        fi
    else
        log_warning "Docker not available, skipping containerized migrations"

        # Fallback to local npm if available
        if command -v npm &> /dev/null; then
            npm run db:migrate:deploy
        else
            log_error "Cannot run migrations - no Docker or npm available"
            exit 1
        fi
    fi
}

# Function to start new containers
start_containers() {
    log_info "Starting new containers..."

    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" up -d

        if [ $? -eq 0 ]; then
            log_success "Containers started successfully"
        else
            log_error "Failed to start containers"
            exit 1
        fi
    else
        log_error "Compose file not found: ${COMPOSE_FILE}"
        log_info "Please create a docker-compose file for ${ENVIRONMENT}"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    # Wait for application to start
    sleep 10

    # Get the application URL from environment
    APP_URL="${APP_URL:-http://localhost:3000}"

    # Check health endpoint
    HEALTH_ENDPOINT="${APP_URL}/api/health"

    log_info "Checking health endpoint: ${HEALTH_ENDPOINT}"

    RETRY_COUNT=0
    MAX_RETRIES=30

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" || echo "000")

        if [ "$HTTP_CODE" = "200" ]; then
            log_success "Application is healthy!"
            return 0
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_info "Attempt ${RETRY_COUNT}/${MAX_RETRIES}: Health check returned ${HTTP_CODE}, waiting..."
        sleep 2
    done

    log_error "Health check failed after ${MAX_RETRIES} attempts"
    return 1
}

# Function to cleanup old images
cleanup_images() {
    log_info "Cleaning up old Docker images..."

    # Remove dangling images
    docker image prune -f

    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "========================================="
    log_info "  Azaire Fleet Manager - Deployment"
    log_info "  Environment: ${ENVIRONMENT}"
    log_info "  Image: ${IMAGE_TAG}"
    log_info "  Time: $(date)"
    log_info "========================================="
    echo ""

    # Confirmation prompt for production
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "You are about to deploy to PRODUCTION"
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi

    # Step 1: Create database backup
    backup_database

    # Step 2: Pull latest image (if not using local)
    if [[ $IMAGE_TAG != "latest" ]] && [[ $IMAGE_TAG == ghcr.io/* ]]; then
        pull_image
    fi

    # Step 3: Stop existing containers
    stop_containers

    # Step 4: Run database migrations
    run_migrations

    # Step 5: Start new containers
    start_containers

    # Step 6: Verify deployment
    if verify_deployment; then
        log_success "Deployment completed successfully!"
    else
        log_error "Deployment verification failed"
        log_warning "Consider running rollback: ./scripts/rollback.sh"
        exit 1
    fi

    # Step 7: Cleanup
    cleanup_images

    echo ""
    log_success "========================================="
    log_success "  Deployment to ${ENVIRONMENT} complete!"
    log_success "========================================="
}

# Run main function
main

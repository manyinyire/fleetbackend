#!/bin/bash

###############################################################################
# Azaire Fleet Manager - Database Migration Script
#
# Usage: ./scripts/migrate.sh [environment] [action]
#   environment: production | staging | development | local
#   action: deploy | status | reset | create (default: deploy)
#
# Examples:
#   ./scripts/migrate.sh production deploy
#   ./scripts/migrate.sh staging status
#   ./scripts/migrate.sh development reset
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    echo "Usage: $0 [environment] [action]"
    echo "  environment: production | staging | development | local"
    echo "  action: deploy | status | reset | create (default: deploy)"
    exit 1
fi

ENVIRONMENT=$1
ACTION=${2:-"deploy"}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development|local)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(deploy|status|reset|create)$ ]]; then
    log_error "Invalid action: $ACTION"
    echo "Valid actions: deploy, status, reset, create"
    exit 1
fi

log_info "========================================="
log_info "  Database Migration"
log_info "  Environment: ${ENVIRONMENT}"
log_info "  Action: ${ACTION}"
log_info "  Time: $(date)"
log_info "========================================="
echo ""

# Load environment variables
ENV_FILE=".env.${ENVIRONMENT}"
if [ "$ENVIRONMENT" = "local" ]; then
    ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
    log_info "Loading environment from: ${ENV_FILE}"
    set -a
    source "$ENV_FILE"
    set +a
else
    log_error "Environment file not found: ${ENV_FILE}"
    exit 1
fi

# Verify DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL is not set in ${ENV_FILE}"
    exit 1
fi

log_success "Database URL loaded"
echo ""

# Function to deploy migrations
deploy_migrations() {
    log_info "Deploying migrations..."

    # Production warning
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "You are about to run migrations on PRODUCTION database"
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Migration cancelled"
            exit 0
        fi
    fi

    # Run migrations
    npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        log_success "Migrations deployed successfully"

        # Show migration status
        log_info "Current migration status:"
        npx prisma migrate status
    else
        log_error "Migration deployment failed"
        exit 1
    fi
}

# Function to check migration status
check_status() {
    log_info "Checking migration status..."
    echo ""

    npx prisma migrate status

    if [ $? -eq 0 ]; then
        echo ""
        log_success "Migration status check completed"
    else
        log_error "Failed to check migration status"
        exit 1
    fi
}

# Function to reset database
reset_database() {
    log_warning "DATABASE RESET"
    log_warning "This will:"
    log_warning "  1. Drop all tables"
    log_warning "  2. Recreate the database schema"
    log_warning "  3. Run all migrations"
    log_warning "  4. Seed the database"
    echo ""

    # Production protection
    if [ "$ENVIRONMENT" = "production" ]; then
        log_error "Database reset is not allowed in production!"
        log_error "Use migration rollback instead"
        exit 1
    fi

    read -p "Are you ABSOLUTELY sure you want to reset the database? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Reset cancelled"
        exit 0
    fi

    log_info "Resetting database..."

    npx prisma migrate reset --force

    if [ $? -eq 0 ]; then
        log_success "Database reset completed"
        log_success "Database has been seeded with initial data"
    else
        log_error "Database reset failed"
        exit 1
    fi
}

# Function to create new migration
create_migration() {
    log_info "Creating new migration..."

    if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "local" ]; then
        log_error "Migrations should only be created in development/local environment"
        exit 1
    fi

    read -p "Enter migration name: " -r MIGRATION_NAME

    if [ -z "$MIGRATION_NAME" ]; then
        log_error "Migration name cannot be empty"
        exit 1
    fi

    log_info "Creating migration: ${MIGRATION_NAME}"

    npx prisma migrate dev --name "$MIGRATION_NAME" --create-only

    if [ $? -eq 0 ]; then
        log_success "Migration created successfully"
        log_info "Please review the migration file before applying it"

        # Show the migration file
        LATEST_MIGRATION=$(ls -t prisma/migrations | head -n1)
        log_info "Migration file: prisma/migrations/${LATEST_MIGRATION}"

        read -p "Do you want to apply this migration now? (yes/no): " -r
        echo
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            npx prisma migrate dev
            log_success "Migration applied"
        else
            log_info "Migration created but not applied"
            log_info "Run 'npm run db:migrate:dev' to apply it"
        fi
    else
        log_error "Failed to create migration"
        exit 1
    fi
}

# Function to backup before migration (production only)
backup_before_migration() {
    if [ "$ENVIRONMENT" = "production" ] && [ "$ACTION" = "deploy" ]; then
        log_info "Creating pre-migration backup..."

        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_DIR="./backups"
        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="${BACKUP_DIR}/pre_migration_${TIMESTAMP}.sql"

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
                gzip "$BACKUP_FILE"
                log_success "Backup created: ${BACKUP_FILE}.gz"
            else
                log_error "Backup failed"
                exit 1
            fi
        fi
    fi
}

# Main execution
main() {
    # Create backup for production deployments
    backup_before_migration

    # Execute action
    case $ACTION in
        deploy)
            deploy_migrations
            ;;
        status)
            check_status
            ;;
        reset)
            reset_database
            ;;
        create)
            create_migration
            ;;
    esac

    echo ""
    log_success "========================================="
    log_success "  Migration ${ACTION} completed"
    log_success "========================================="
}

# Run main function
main

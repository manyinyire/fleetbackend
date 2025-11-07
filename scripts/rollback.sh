#!/bin/bash

###############################################################################
# Azaire Fleet Manager - Rollback Script
#
# Usage: ./scripts/rollback.sh [environment] [backup-file]
#   environment: production | staging | development
#   backup-file: Specific backup to restore (optional)
#
# Examples:
#   ./scripts/rollback.sh production
#   ./scripts/rollback.sh staging backups/db_backup_staging_20250105_143000.sql.gz
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
    echo "Usage: $0 [environment] [backup-file]"
    exit 1
fi

ENVIRONMENT=$1
BACKUP_FILE=${2:-""}
BACKUP_DIR="./backups"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    exit 1
fi

log_warning "========================================="
log_warning "  ROLLBACK INITIATED"
log_warning "  Environment: ${ENVIRONMENT}"
log_warning "  Time: $(date)"
log_warning "========================================="
echo ""

# Confirmation prompt
log_warning "This will rollback the ${ENVIRONMENT} environment to a previous state"
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Rollback cancelled"
    exit 0
fi

# Function to list available backups
list_backups() {
    log_info "Available backups for ${ENVIRONMENT}:"
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        local backups=($(ls -t "${BACKUP_DIR}/db_backup_${ENVIRONMENT}"*.sql.gz 2>/dev/null || echo ""))

        if [ ${#backups[@]} -eq 0 ]; then
            log_warning "No backups found for ${ENVIRONMENT}"
            return 1
        fi

        local index=1
        for backup in "${backups[@]}"; do
            local size=$(du -h "$backup" | cut -f1)
            local date=$(stat -c %y "$backup" | cut -d'.' -f1)
            echo "  ${index}. $(basename $backup)"
            echo "     Size: ${size} | Date: ${date}"
            echo ""
            index=$((index + 1))
        done

        return 0
    else
        log_error "Backup directory not found: ${BACKUP_DIR}"
        return 1
    fi
}

# Function to select backup
select_backup() {
    if [ -n "$BACKUP_FILE" ]; then
        if [ -f "$BACKUP_FILE" ]; then
            echo "$BACKUP_FILE"
            return 0
        else
            log_error "Specified backup file not found: ${BACKUP_FILE}"
            return 1
        fi
    fi

    list_backups

    if [ $? -ne 0 ]; then
        return 1
    fi

    echo ""
    read -p "Select backup number to restore (or 'q' to quit): " -r

    if [[ $REPLY == "q" ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    local backups=($(ls -t "${BACKUP_DIR}/db_backup_${ENVIRONMENT}"*.sql.gz 2>/dev/null))
    local index=$((REPLY - 1))

    if [ $index -ge 0 ] && [ $index -lt ${#backups[@]} ]; then
        echo "${backups[$index]}"
        return 0
    else
        log_error "Invalid selection"
        return 1
    fi
}

# Function to restore database
restore_database() {
    local backup=$1

    log_info "Restoring database from: $(basename $backup)"

    # Load environment variables
    if [ -f ".env.${ENVIRONMENT}" ]; then
        set -a
        source ".env.${ENVIRONMENT}"
        set +a
    else
        log_error "Environment file not found: .env.${ENVIRONMENT}"
        return 1
    fi

    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL not set"
        return 1
    fi

    # Extract database connection details
    DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
    if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"

        # Decompress and restore
        log_info "Decompressing backup..."
        gunzip -c "$backup" > /tmp/restore.sql

        log_info "Restoring database..."
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < /tmp/restore.sql

        if [ $? -eq 0 ]; then
            log_success "Database restored successfully"
            rm /tmp/restore.sql
            return 0
        else
            log_error "Database restore failed"
            rm /tmp/restore.sql
            return 1
        fi
    else
        log_error "Could not parse DATABASE_URL"
        return 1
    fi
}

# Function to restart application
restart_application() {
    log_info "Restarting application..."

    # Try PM2 first (for production server deployments)
    if command -v pm2 &> /dev/null; then
        log_info "Restarting with PM2..."
        pm2 restart ecosystem.config.js --env ${ENVIRONMENT}
        pm2 save

        if [ $? -eq 0 ]; then
            log_success "PM2 application restarted"
            return 0
        else
            log_error "Failed to restart PM2 application"
            return 1
        fi
    fi

    # Try Docker Compose (for containerized deployments)
    COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    if [ -f "$COMPOSE_FILE" ]; then
        log_info "Restarting with Docker Compose..."
        docker-compose -f "$COMPOSE_FILE" restart

        if [ $? -eq 0 ]; then
            log_success "Containers restarted"
            return 0
        else
            log_error "Failed to restart containers"
            return 1
        fi
    fi

    log_error "No deployment method found (PM2 or Docker Compose)"
    return 1
}

# Function to verify rollback
verify_rollback() {
    log_info "Verifying rollback..."

    if [ -x "./scripts/health-check.sh" ]; then
        ./scripts/health-check.sh
        return $?
    else
        log_warning "Health check script not found, skipping verification"
        return 0
    fi
}

# Main rollback flow
main() {
    # Select backup to restore
    SELECTED_BACKUP=$(select_backup)

    if [ $? -ne 0 ] || [ -z "$SELECTED_BACKUP" ]; then
        log_error "No backup selected"
        exit 1
    fi

    echo ""
    log_info "Selected backup: $(basename $SELECTED_BACKUP)"
    echo ""

    # Final confirmation
    log_warning "This will:"
    log_warning "  1. Restore the database from the selected backup"
    log_warning "  2. Restart the application (PM2 or Docker)"
    log_warning "  3. Verify the application health"
    echo ""
    read -p "Proceed with rollback? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    # Step 1: Restore database
    if restore_database "$SELECTED_BACKUP"; then
        log_success "Database restored"
    else
        log_error "Rollback failed at database restore"
        exit 1
    fi

    # Step 2: Restart application
    if restart_application; then
        log_success "Application restarted"
    else
        log_warning "Application restart failed, but database was restored"
    fi

    # Step 3: Verify rollback
    if verify_rollback; then
        log_success "Rollback verification passed"
    else
        log_warning "Health check failed after rollback"
    fi

    echo ""
    log_success "========================================="
    log_success "  Rollback completed"
    log_success "========================================="
}

# Run main function
main

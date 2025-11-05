#!/bin/bash

###############################################################################
# Azaire Fleet Manager - Health Check Script
#
# Usage: ./scripts/health-check.sh [url] [timeout]
#   url: Application URL (default: http://localhost:3000)
#   timeout: Maximum wait time in seconds (default: 60)
#
# Examples:
#   ./scripts/health-check.sh https://app.example.com
#   ./scripts/health-check.sh http://localhost:3000 30
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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_URL=${1:-"http://localhost:3000"}
TIMEOUT=${2:-60}
HEALTH_ENDPOINT="${APP_URL}/api/health"

log_info "Health check starting..."
log_info "URL: ${HEALTH_ENDPOINT}"
log_info "Timeout: ${TIMEOUT}s"
echo ""

# Function to check endpoint
check_health() {
    local response
    local http_code

    response=$(curl -s -w "\n%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    echo "$http_code:$body"
}

# Function to check database connectivity
check_database() {
    log_info "Checking database connectivity..."

    # Try to parse response for database status
    local health_data=$1

    if echo "$health_data" | grep -q "database"; then
        if echo "$health_data" | grep -q "\"database\":\"healthy\""; then
            log_success "✓ Database connection: healthy"
            return 0
        else
            log_error "✗ Database connection: unhealthy"
            return 1
        fi
    else
        log_info "○ Database status: unknown"
        return 0
    fi
}

# Function to check Redis connectivity
check_redis() {
    log_info "Checking Redis connectivity..."

    local health_data=$1

    if echo "$health_data" | grep -q "redis"; then
        if echo "$health_data" | grep -q "\"redis\":\"healthy\""; then
            log_success "✓ Redis connection: healthy"
            return 0
        else
            log_error "✗ Redis connection: unhealthy"
            return 1
        fi
    else
        log_info "○ Redis status: unknown"
        return 0
    fi
}

# Main health check loop
START_TIME=$(date +%s)
RETRY_COUNT=0

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))

    if [ $ELAPSED -ge $TIMEOUT ]; then
        log_error "Health check timeout after ${TIMEOUT}s"
        exit 1
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))

    log_info "Attempt ${RETRY_COUNT} (${ELAPSED}s elapsed)..."

    # Perform health check
    RESULT=$(check_health)
    HTTP_CODE=$(echo "$RESULT" | cut -d':' -f1)
    BODY=$(echo "$RESULT" | cut -d':' -f2-)

    if [ "$HTTP_CODE" = "200" ]; then
        echo ""
        log_success "========================================="
        log_success "  Application is healthy!"
        log_success "========================================="
        echo ""

        log_info "Response details:"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
        echo ""

        # Check components
        check_database "$BODY"
        check_redis "$BODY"

        echo ""
        log_success "All health checks passed!"
        log_info "Total time: ${ELAPSED}s"
        exit 0
    else
        log_error "Health check failed (HTTP ${HTTP_CODE})"

        if [ $RETRY_COUNT -eq 1 ]; then
            log_info "Retrying in 2 seconds..."
        fi

        sleep 2
    fi
done

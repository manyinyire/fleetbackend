#!/bin/bash

###############################################################################
# Environment Validation Script
#
# Usage: ./scripts/validate-env.sh [env-file]
#   env-file: Path to .env file (optional, defaults to .env)
#
# Examples:
#   ./scripts/validate-env.sh
#   ./scripts/validate-env.sh .env.production
###############################################################################

set -e
set -u

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

# Get environment file path
ENV_FILE="${1:-.env}"

log_info "Validating environment file: ${ENV_FILE}"
echo ""

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
    log_error "Environment file not found: ${ENV_FILE}"
    exit 1
fi

# Required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "BETTER_AUTH_SECRET"
    "BETTER_AUTH_URL"
    "NEXT_PUBLIC_APP_URL"
    "SUPER_ADMIN_PASSWORD"
)

# Optional but recommended variables
RECOMMENDED_VARS=(
    "NODE_ENV"
    "PORT"
    "NEXTAUTH_URL"
)

# Track validation status
ERRORS=0
WARNINGS=0

# Function to check if variable exists and is not empty
check_variable() {
    local var_name=$1
    local is_required=$2

    if grep -q "^${var_name}=" "$ENV_FILE"; then
        # Variable exists, check if it has a value
        local value=$(grep "^${var_name}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

        if [ -z "$value" ]; then
            if [ "$is_required" = "true" ]; then
                log_error "${var_name} is empty"
                ERRORS=$((ERRORS + 1))
            else
                log_warning "${var_name} is empty"
                WARNINGS=$((WARNINGS + 1))
            fi
        else
            log_success "${var_name} is set"

            # Additional validation for specific variables
            case "$var_name" in
                "DATABASE_URL")
                    if [[ ! $value =~ ^postgresql:// ]]; then
                        log_warning "DATABASE_URL should start with 'postgresql://'"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                    ;;
                "BETTER_AUTH_URL"|"NEXT_PUBLIC_APP_URL"|"NEXTAUTH_URL")
                    if [[ ! $value =~ ^https?:// ]]; then
                        log_warning "${var_name} should start with 'http://' or 'https://'"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                    ;;
                "BETTER_AUTH_SECRET")
                    if [ ${#value} -lt 32 ]; then
                        log_warning "BETTER_AUTH_SECRET should be at least 32 characters long"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                    ;;
                "SUPER_ADMIN_PASSWORD")
                    if [ ${#value} -lt 12 ]; then
                        log_warning "SUPER_ADMIN_PASSWORD should be at least 12 characters long"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                    ;;
                "NODE_ENV")
                    if [[ ! $value =~ ^(development|production|test)$ ]]; then
                        log_warning "NODE_ENV should be 'development', 'production', or 'test'"
                        WARNINGS=$((WARNINGS + 1))
                    fi
                    ;;
            esac
        fi
    else
        if [ "$is_required" = "true" ]; then
            log_error "${var_name} is not set"
            ERRORS=$((ERRORS + 1))
        else
            log_warning "${var_name} is not set (recommended)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
}

echo "=== Checking Required Variables ==="
echo ""

for var in "${REQUIRED_VARS[@]}"; do
    check_variable "$var" "true"
done

echo ""
echo "=== Checking Recommended Variables ==="
echo ""

for var in "${RECOMMENDED_VARS[@]}"; do
    check_variable "$var" "false"
done

# Check for common mistakes
echo ""
echo "=== Checking for Common Issues ==="
echo ""

# Check for placeholder values
if grep -q "your_secret_here\|changeme\|placeholder" "$ENV_FILE"; then
    log_warning "Found placeholder values in environment file"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for spaces around equals sign
if grep -q " = " "$ENV_FILE"; then
    log_warning "Found spaces around '=' sign (should be VAR=value)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check file permissions
PERMS=$(stat -c "%a" "$ENV_FILE" 2>/dev/null || stat -f "%A" "$ENV_FILE" 2>/dev/null || echo "unknown")
if [ "$PERMS" != "600" ] && [ "$PERMS" != "unknown" ]; then
    log_warning "Environment file permissions are ${PERMS} (recommended: 600)"
    log_info "Fix with: chmod 600 ${ENV_FILE}"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    log_success "Environment validation passed with no issues!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    log_warning "Environment validation passed with ${WARNINGS} warning(s)"
    exit 0
else
    log_error "Environment validation failed with ${ERRORS} error(s) and ${WARNINGS} warning(s)"
    exit 1
fi

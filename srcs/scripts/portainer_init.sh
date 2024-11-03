#!/bin/bash

# Constants
DB_FILE="./srcs/data/portainer_data/portainer.db"
URL="https://portainer.pong-br.com/api/users/admin/init"
MAX_RETRIES=3
RETRY_DELAY=5

# Colors and emojis for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logger function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    case $level in
        "INFO")
            echo -e "🔵 ${GREEN}[INFO]${NC} ${timestamp} - $message"
            ;;
        "WARN")
            echo -e "⚠️  ${YELLOW}[WARN]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "❌ ${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
        "SUCCESS")
            echo -e "✅ ${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
            ;;
    esac
}

# Function to check URL availability
check_url() {
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl --output /dev/null --silent --head --connect-timeout 5 "$URL"; then
            log "SUCCESS" "URL $URL is reachable"
            return 0
        fi
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log "WARN" "URL not reachable, retrying in $RETRY_DELAY seconds... (Attempt $retries/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    done
    log "ERROR" "URL $URL is not reachable after $MAX_RETRIES attempts"
    return 1
}

# Function to check and create data directory
check_data_directory() {
    local data_dir="./srcs/data/portainer_data"
    if [ ! -d "$data_dir" ]; then
        log "INFO" "Creating Portainer data directory..."
        mkdir -p "$data_dir"
        if [ ! -d "$data_dir" ]; then
            log "ERROR" "Failed to create Portainer data directory"
            return 1
        fi
    fi
    return 0
}

# Main function
main() {
    log "INFO" "🚀 Starting Portainer initialization..."

    # Check data directory
    if ! check_data_directory; then
        exit 1
    fi

    # Check if already initialized
    if [ -f "$DB_FILE" ]; then
        log "INFO" "Portainer is already initialized"
        exit 0
    fi

    # Check URL availability
    if ! check_url; then
        exit 1
    fi

    # Initialize Portainer
    log "INFO" "Initializing Portainer..."
    local response
    response=$(curl -s "$URL" \
        -H 'Referer: https://portainer.pong-br.com/' \
        -H 'Accept: application/json, text/plain, */*' \
        -H 'Content-Type: application/json' \
        --data-raw '{"Username":"transcendence","Password":"transcendence"}')

    if [ $? -eq 0 ]; then
        log "SUCCESS" "Portainer initialized successfully"
    else
        log "ERROR" "Failed to initialize Portainer"
        exit 1
    fi
}

# Run main function
main

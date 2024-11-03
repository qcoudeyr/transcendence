#!/bin/bash

# Set error handling
set -euo pipefail

# Constants
CERT_BASE_DIR="./srcs/data/certificates"
CA_KEY_SIZE=4096
SERVICE_KEY_SIZE=2048
CERT_VALIDITY_DAYS=365

# Colors for output
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

# Function to check and create directories
check_directories() {
    local dirs=("$CERT_BASE_DIR" "$CERT_BASE_DIR/vault")

    log "INFO" "Checking and creating required directories..."

    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir" &
        fi
    done
    wait

    # Verify directories were created
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log "ERROR" "Failed to create directory: $dir"
            return 1
        fi
    done

    log "SUCCESS" "Directories verified and created"
    return 0
}

# Function to generate root CA
generate_root_ca() {
    log "INFO" "Generating root CA..."

    # Generate root CA private key
    openssl genrsa -out "$CERT_BASE_DIR/root-ca.key" $CA_KEY_SIZE &
    wait

    if [ ! -f "$CERT_BASE_DIR/root-ca.key" ]; then
        log "ERROR" "Failed to generate root CA private key"
        return 1
    fi

    # Generate root CA certificate
    openssl req -x509 -new -nodes \
        -key "$CERT_BASE_DIR/root-ca.key" \
        -sha256 -days 1024 \
        -out "$CERT_BASE_DIR/root-ca.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=root-ca" &
    wait

    if [ ! -f "$CERT_BASE_DIR/root-ca.crt" ]; then
        log "ERROR" "Failed to generate root CA certificate"
        return 1
    fi

    log "SUCCESS" "Root CA generated successfully"
    return 0
}

# Function to generate service certificate
generate_service_cert() {
    local service=$1
    local domain=$2
    local service_dir="$CERT_BASE_DIR/$service"

    log "INFO" "Generating certificate for $service..."

    mkdir -p "$service_dir"

    # Generate operations in parallel
    {
        # Generate service private key
        openssl genrsa -out "$service_dir/$service.key" $SERVICE_KEY_SIZE

        # Generate CSR config
        cat > "$service_dir/$service.conf" <<EOF
[req]
default_bits = $SERVICE_KEY_SIZE
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
C = US
ST = State
L = City
O = Organization
OU = Unit
CN = $domain

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = $domain
DNS.2 = *.$domain
IP.1 = 127.0.0.1
EOF
    } &
    wait

    # Generate CSR and certificate sequentially as they depend on previous steps
    if ! openssl req -new \
        -key "$service_dir/$service.key" \
        -out "$service_dir/$service.csr" \
        -config "$service_dir/$service.conf"; then
        log "ERROR" "Failed to generate CSR for $service"
        return 1
    fi

    if ! openssl x509 -req \
        -in "$service_dir/$service.csr" \
        -CA "$CERT_BASE_DIR/root-ca.crt" \
        -CAkey "$CERT_BASE_DIR/root-ca.key" \
        -CAcreateserial \
        -out "$service_dir/$service.crt" \
        -days $CERT_VALIDITY_DAYS \
        -sha256 \
        -extensions req_ext \
        -extfile "$service_dir/$service.conf"; then
        log "ERROR" "Failed to generate certificate for $service"
        return 1
    fi

    # Generate PEM file
    cat "$service_dir/$service.crt" "$service_dir/$service.key" > "$service_dir/$service.pem"

    # Set permissions in parallel
    {
        chmod 644 "$service_dir/$service.crt"
        chmod 644 "$service_dir/$service.pem"
        chmod 600 "$service_dir/$service.key"
    } &
    wait

    log "SUCCESS" "Certificate generated for $service"
    return 0
}

# Main execution
main() {
    log "INFO" "Starting TLS setup..."

    # Check and create directories
    if ! check_directories; then
        exit 1
    fi

    # Generate root CA
    if ! generate_root_ca; then
        exit 1
    fi

    # Generate service certificates
    if ! generate_service_cert "vault" "vault"; then
        exit 1
    fi

    log "SUCCESS" "TLS setup completed successfully"
}

# Run main function
main

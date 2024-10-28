#!/bin/bash

# Set error handling
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logger function
log() {
    local level=$1
    shift
    local message=$@
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
    esac
}

# Function to generate root CA
generate_root_ca() {
    local ca_dir="./data/certificates"
    mkdir -p "$ca_dir"

    # Generate root CA private key
    openssl genrsa -out "$ca_dir/root-ca.key" 4096

    # Generate root CA certificate
    openssl req -x509 -new -nodes \
        -key "$ca_dir/root-ca.key" \
        -sha256 -days 1024 \
        -out "$ca_dir/root-ca.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=root-ca"

    log "INFO" "Root CA generated successfully"
}

# Function to generate service certificate
generate_service_cert() {
    local service=$1
    local domain=$2
    local ca_dir="./data/certificates"
    local service_dir="./data/certificates/$service"

    mkdir -p "$service_dir"

    # Generate service private key
    openssl genrsa -out "$service_dir/$service.key" 2048

    # Generate CSR config
    cat > "$service_dir/$service.conf" <<EOF
[req]
default_bits = 2048
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

    # Generate CSR
    openssl req -new \
        -key "$service_dir/$service.key" \
        -out "$service_dir/$service.csr" \
        -config "$service_dir/$service.conf"

    # Generate certificate
    openssl x509 -req \
        -in "$service_dir/$service.csr" \
        -CA "$ca_dir/root-ca.crt" \
        -CAkey "$ca_dir/root-ca.key" \
        -CAcreateserial \
        -out "$service_dir/$service.crt" \
        -days 365 \
        -sha256 \
        -extensions req_ext \
        -extfile "$service_dir/$service.conf"

    log "INFO" "Certificate generated for $service"

    # Generate PEM file by concatenating certificate and private key
    cat "$service_dir/$service.crt" "$service_dir/$service.key" > "$service_dir/$service.pem"
    log "INFO" "PEM file generated for $service"

	chmod 644 "$service_dir/$service.crt"
	chmod 644 "$service_dir/$service.pem"
}

# Main execution
main() {
    log "INFO" "Starting TLS setup..."

    # Generate root CA
    generate_root_ca

    # Generate certificates for services
    generate_service_cert "vault" "vault"

    log "INFO" "TLS setup for vault completed successfully"
}

# Run main function
main

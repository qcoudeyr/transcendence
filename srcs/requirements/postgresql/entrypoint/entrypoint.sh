#!/usr/bin/env sh

set -eu

# Logging functions
log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# Function to export secrets based on environment setting
export_secrets() {
    _secrets=$1

    # Simplified export approach that works in both sh and bash
    eval "$(echo "$_secrets" | /vault/entrypoint/jq -r 'to_entries | .[] | "export \(.key)=\(.value)"')"
    log_info "Environment variables set using export"
}

# Function to fetch secrets from Vault
fetch_vault_secrets() {
    _service_name=$1
    _secret_path=$2

    log_info "Attempting to fetch secrets for service: $_service_name"

    # Read AppRole credentials
    if [ ! -f "/vault/config/${_service_name}_approle.env" ]; then
        log_error "AppRole credentials file not found at /vault/config/${_service_name}_approle.env"
        exit 1
    fi

    . "/vault/config/${_service_name}_approle.env"
    log_info "Successfully loaded AppRole credentials"

    # Login to Vault using AppRole
    log_info "Authenticating with Vault"
    VAULT_RESPONSE=$(/vault/entrypoint/curl --cacert /vault/entrypoint/certs/rootCA.crt --insecure -s \
        --request POST \
        --data "{\"role_id\":\"${ROLE_ID}\",\"secret_id\":\"${SECRET_ID}\"}" ${VAULT_ADDR}/v1/auth/${_service_name}/login)
    VAULT_TOKEN=$(echo "$VAULT_RESPONSE" | /vault/entrypoint/jq -r '.auth.client_token')

    if [ -z "$VAULT_TOKEN" ] || [ "$VAULT_TOKEN" = "null" ]; then
        log_error "Failed to obtain Vault token"
        exit 1
    fi
    log_info "Successfully authenticated with Vault"

    # Fetch secrets
    log_info "Fetching secrets from path: $_secret_path"
    SECRETS=$(/vault/entrypoint/curl --cacert /vault/entrypoint/certs/rootCA.crt --insecure -s \
        --header "X-Vault-Token: ${VAULT_TOKEN}" \
        ${VAULT_ADDR}/v1/kv/data/${_secret_path} | /vault/entrypoint/jq -r '.data.data')

    if [ -z "$SECRETS" ] || [ "$SECRETS" = "null" ]; then
        log_error "Failed to fetch secrets from path: $_secret_path"
        exit 1
    fi

    # Export secrets using the appropriate method
    export_secrets "$SECRETS"
    log_info "Successfully set secrets as environment variables"
}

# Function to export secrets based on environment setting
fix_postgresql_perms() {
    log_info "Starting fix cert permission fot tls"
	chown root:postgres /etc/ssl/private/server.crt
	chmod 640 /etc/ssl/private/server.crt
	chown root:postgres /etc/ssl/private/server.key
	chmod 640 /etc/ssl/private/server.key
    log_info "Successfully fixed permission fot tls"
}

# Call main function with service name and path
log_info "Starting secrets fetch process"
fetch_vault_secrets "$SERVICE_NAME" "$SECRET_PATH"
log_info "Successfully completed secrets fetch process"

fix_postgresql_perms

# Execute the original command
log_info "Executing command: $*"
exec "$@"

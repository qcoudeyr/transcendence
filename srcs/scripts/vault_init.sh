#!/bin/bash

# Constants
MAX_RETRIES=3
RETRY_DELAY=5
VAULT_CONTAINER="tr_vault"
GPG_KEY_NAME="vault-key"
GPG_KEY_EMAIL="vault-key@example.com"
OUTPUT_FILE="./srcs/vault_root_token.gpg"
DEFAULT_DEV_PASSPHRASE="development-passphrase-123"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

log_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

log_info() {
    echo -e "${YELLOW}INFO: $1${NC}"
}

# Function to retry commands
retry_command() {
    local cmd="$1"
    local retries=0
    local result

    while [ $retries -lt $MAX_RETRIES ]; do
        if eval "$cmd"; then
            return 0
        fi

        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log_info "Command failed. Retrying in $RETRY_DELAY seconds... (Attempt $retries/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    done

    log_error "Command failed after $MAX_RETRIES attempts"
    return 1
}

# Function to check if Vault container is running
check_vault_container() {
    if ! docker ps | grep -q $VAULT_CONTAINER; then
        log_error "Vault container '$VAULT_CONTAINER' is not running"
        return 1
    fi
    return 0
}

# Function to check if a GPG key exists
check_gpg_key() {
    if gpg --list-keys "$GPG_KEY_NAME" &>/dev/null; then
        log_info "GPG key '$GPG_KEY_NAME' already exists"
        return 0
    fi
    log_info "No GPG key with name '$GPG_KEY_NAME' found. Generating a new key..."
    return 1
}

# Function to generate a new GPG key
generate_gpg_key() {
    local passphrase

    if [ "$DEV" = "1" ]; then
        log_info "Development mode: Using default passphrase"
        passphrase="$DEFAULT_DEV_PASSPHRASE"
    else
        read -s -p "Enter passphrase for GPG key: " passphrase
        echo
    fi

    # Create temporary batch file for key generation
    local batch_file=$(mktemp)
    cat > "$batch_file" <<EOF
%echo Generating GPG key
Key-Type: RSA
Key-Length: 2048
Name-Real: $GPG_KEY_NAME
Name-Email: $GPG_KEY_EMAIL
Name-Comment: $GPG_KEY_NAME
Expire-Date: 0
Passphrase: $passphrase
%commit
%echo Done
EOF

    if ! gpg --batch --generate-key "$batch_file"; then
        log_error "Failed to generate GPG key"
        rm "$batch_file"
        return 1
    fi

    rm "$batch_file"
    log_success "GPG key generated successfully"
    return 0
}

# Function to get the GPG key ID
get_gpg_key_id() {
    local key_id
    key_id=$(gpg --list-keys --with-colons "$GPG_KEY_NAME" | grep "^pub" | cut -d':' -f5)
    if [ -z "$key_id" ]; then
        log_error "Failed to retrieve GPG key ID"
        return 1
    fi
    echo "$key_id"
    return 0
}

# Function to initialize Vault
initialize_vault() {
    local init_output
    init_output=$(retry_command "docker exec $VAULT_CONTAINER vault operator init -format=json")
    if [ $? -ne 0 ]; then
        log_error "Failed to initialize Vault"
        return 1
    fi
    echo "$init_output"
}

# Function to unseal Vault
unseal_vault() {
    local keys=("$1" "$2" "$3")

    for key in "${keys[@]}"; do
        if ! retry_command "docker exec $VAULT_CONTAINER vault operator unseal $key"; then
            log_error "Failed to unseal Vault with one of the keys"
            return 1
        fi
    done

    log_success "Vault unsealed successfully"
    return 0
}

# Function to login to Vault
login_vault() {
    local token="$1"
    if ! retry_command "docker exec $VAULT_CONTAINER vault login $token"; then
        log_error "Failed to login to Vault"
        return 1
    fi
    log_success "Successfully logged into Vault"
    return 0
}

# Function to encrypt Vault keys
encrypt_keys() {
    local gpg_key_id="$1"
    local vault_keys="$2"

    if ! echo "$vault_keys" | gpg --encrypt --recipient "$gpg_key_id" --output "$OUTPUT_FILE" 2>/dev/null; then
        log_error "Failed to encrypt Vault keys"
        return 1
    fi

    log_success "Vault keys encrypted and saved to $OUTPUT_FILE"
    return 0
}

# Main function
main() {
    # Check if Vault container is running
    if ! check_vault_container; then
        exit 1
    fi

    # Check/Generate GPG key
    if ! check_gpg_key; then
        if ! generate_gpg_key; then
            exit 1
        fi
    fi

    # Get GPG key ID
    GPG_KEY_ID=$(get_gpg_key_id)
    if [ $? -ne 0 ]; then
        exit 1
    fi

    # Initialize Vault
    log_info "Initializing Vault..."
    VAULT_INIT=$(initialize_vault)
    if [ $? -ne 0 ]; then
        exit 1
    fi

    # Extract keys and token
    ROOT_TOKEN=$(echo "$VAULT_INIT" | jq -r '.root_token')
    UNSEAL_KEYS=($(echo "$VAULT_INIT" | jq -r '.unseal_keys_b64[]'))

    # Validate extracted values
    if [[ -z "$ROOT_TOKEN" || ${#UNSEAL_KEYS[@]} -lt 5 ]]; then
        log_error "Failed to extract Vault keys or root token"
        exit 1
    fi

    # Unseal Vault
    log_info "Unsealing Vault..."
    if ! unseal_vault "${UNSEAL_KEYS[0]}" "${UNSEAL_KEYS[1]}" "${UNSEAL_KEYS[2]}"; then
        exit 1
    fi

    # Login to Vault
    log_info "Logging into Vault..."
    if ! login_vault "$ROOT_TOKEN"; then
        exit 1
    fi

    # Prepare and encrypt keys
    VAULT_KEYS=$(cat <<EOF
Root Token: $ROOT_TOKEN
Unseal Key 1: ${UNSEAL_KEYS[0]}
Unseal Key 2: ${UNSEAL_KEYS[1]}
Unseal Key 3: ${UNSEAL_KEYS[2]}
Unseal Key 4: ${UNSEAL_KEYS[3]}
Unseal Key 5: ${UNSEAL_KEYS[4]}
EOF
)

    log_info "Encrypting Vault keys..."
    if ! encrypt_keys "$GPG_KEY_ID" "$VAULT_KEYS"; then
        exit 1
    fi
}

# Execute main function
main

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

# Function to parse env file into associative array
parse_env_file() {
    local env_file=$1
    declare -A env_vars
    local current_services=()

    while IFS= read -r line; do
        if [[ $line =~ ^# ]]; then
            current_services=($(echo $line | tr -d '#' | tr ' ' '\n'))
        elif [[ $line =~ ^[A-Z_]+= ]]; then
            local var_name=$(echo $line | cut -d'=' -f1)
            local var_value=$(echo $line | cut -d'=' -f2-)
            for service in "${current_services[@]}"; do
                env_vars["$service,$var_name"]=$var_value
            done
        fi
    done < "$env_file"

    echo $(declare -p env_vars)
}

# Function to decrypt and process vault keys
process_vault_keys() {
    local gpg_file="vault_root_token.gpg"

    if [[ ! -f "$gpg_file" ]]; then
        log "ERROR" "vault_root_token.gpg not found in current directory"
        exit 1
    fi

    # Prompt for GPG passphrase
    log "INFO" "Please enter the GPG passphrase to decrypt vault keys:"
    local decrypted_content
    if ! decrypted_content=$(gpg --decrypt "$gpg_file" 2>/dev/null); then
        log "ERROR" "Failed to decrypt GPG file. Please check your passphrase."
        exit 1
    fi

    # Extract keys from decrypted content
    ROOT_TOKEN=$(echo "$decrypted_content" | grep "Root Token:" | awk -F': ' '{print $2}')
    UNSEAL_KEY_1=$(echo "$decrypted_content" | grep "Unseal Key 1:" | awk -F': ' '{print $2}')
    UNSEAL_KEY_2=$(echo "$decrypted_content" | grep "Unseal Key 2:" | awk -F': ' '{print $2}')
    UNSEAL_KEY_3=$(echo "$decrypted_content" | grep "Unseal Key 3:" | awk -F': ' '{print $2}')

    if [[ -z "$ROOT_TOKEN" || -z "$UNSEAL_KEY_1" || -z "$UNSEAL_KEY_2" || -z "$UNSEAL_KEY_3" ]]; then
        log "ERROR" "Failed to extract required keys from decrypted content"
        exit 1
    fi
}

# Function to check if Vault is sealed
is_vault_sealed() {
    log "INFO" "Checking if the Vault is unseal..."
    local vault_status
    vault_status=$(docker exec tr_vault vault status -format=json 2>/dev/null || echo '{"sealed":true}')
    echo "$vault_status" | jq -r '.sealed' | grep -q 'true'
}

# Function to unseal vault
unseal_vault() {
    log "INFO" "Starting Vault unseal process..."

    if ! is_vault_sealed; then
        log "INFO" "Vault is already unsealed"
        return 0
    fi

    # Process GPG encrypted keys
    process_vault_keys

    # Check if Vault is already unsealed
    local vault_status
    vault_status=$(docker exec tr_vault vault status -format=json 2>/dev/null || echo '{"sealed":true}')

    if echo "$vault_status" | jq -r '.sealed' | grep -q 'false'; then
        log "INFO" "Vault is already unsealed"
        return 0
    fi

    # Unseal Vault using the three keys
    log "INFO" "Unsealing Vault..."

    if ! docker exec tr_vault vault operator unseal "$UNSEAL_KEY_1"; then
        log "ERROR" "Failed to apply first unseal key"
        exit 1
    fi

    if ! docker exec tr_vault vault operator unseal "$UNSEAL_KEY_2"; then
        log "ERROR" "Failed to apply second unseal key"
        exit 1
    fi

    if ! docker exec tr_vault vault operator unseal "$UNSEAL_KEY_3"; then
        log "ERROR" "Failed to apply third unseal key"
        exit 1
    fi

    # Login with root token
    if ! docker exec tr_vault vault login "$ROOT_TOKEN" >/dev/null 2>&1; then
        log "ERROR" "Failed to login with root token"
        exit 1
    fi

    log "INFO" "Vault has been successfully unsealed and root token login completed"
}

# Function to generate secure passwords
generate_secure_password() {
    openssl rand -base64 32
}

# Function to generate Django secret key
generate_django_secret_key() {
    python3 -c 'import secrets; print(secrets.token_urlsafe(50))'
}

# Check if Vault is initialized
check_vault_initialization() {
    local vault_status
    vault_status=$(docker exec tr_vault vault status -format=json 2>/dev/null || echo '{"initialized":false}')

    if ! echo "$vault_status" | jq -r '.initialized' | grep -q 'true'; then
        log "ERROR" "Vault is not initialized. Please run vault_init.sh first."
        exit 1
    fi
}

# Function to create a policy for a service
create_service_policy() {
    local service_name=$1
    local policy_path=$2

    # Create policy document
    local policy_content=$(cat <<EOF
path "${policy_path}" {
    capabilities = ["read"]
}
EOF
)

    # Write policy using echo to properly pipe the content
    echo "$policy_content" | docker exec -i tr_vault vault policy write "${service_name}-policy" -
}

# Function to create AppRole for a service
create_approle() {
    local service_name=$1

    # Create AppRole
    docker exec tr_vault vault auth enable -path=${service_name} approle || true

    # Configure AppRole settings
    docker exec tr_vault vault write auth/${service_name}/role/${service_name} \
        secret_id_ttl=0 \
        token_ttl=1h \
        token_max_ttl=4h \
        token_policies="${service_name}-policy"

    # Get RoleID and SecretID
    local role_id=$(docker exec tr_vault vault read -format=json auth/${service_name}/role/${service_name}/role-id | jq -r '.data.role_id')
    local secret_id=$(docker exec tr_vault vault write -format=json -f auth/${service_name}/role/${service_name}/secret-id | jq -r '.data.secret_id')

    # Store credentials in a temporary file
    echo "ROLE_ID=${role_id}" > ./data/credentials/${service_name}_approle.env
    echo "SECRET_ID=${secret_id}" >> ./data/credentials/${service_name}_approle.env
}

# Function to get password aliases
# Returns the main variable name that should be used for generation
get_password_alias() {
    local var_name=$1

    # Define password aliases (add more as needed)
    case $var_name in
        "POSTGRES_PASSWORD"|"DATABASE_PASSWORD")
            echo "DATABASE_PASSWORD"
            ;;
        "ELASTIC_PASSWORD"|"ELASTICSEARCH_PASSWORD")
            echo "ELASTIC_PASSWORD"
            ;;
        *)
            echo "$var_name"
            ;;
    esac
}

# Main execution
main() {
    log "INFO" "Starting Vault configuration and credential setup..."

    # Check Vault initialization
    check_vault_initialization

    # Unseal Vault if needed
    unseal_vault

    # Create credentials directory
    mkdir -p ./data/credentials
    chmod 700 ./data/credentials

    # Parse the template_credential.env file
    eval $(parse_env_file "template_credential.env")

    # Enable KV secrets engine
    docker exec tr_vault vault secrets enable -path=kv -version=2 kv || true

    # Store generated values for reuse
    declare -A generated_values
    declare -A service_vars

    # First pass: Generate values for each unique variable
    for key in "${!env_vars[@]}"; do
        IFS=',' read -r service var <<< "$key"
        value=${env_vars[$key]}

        if [[ $value == "TOGENERATE" ]]; then
            # Get the main variable name (considering aliases)
            main_var=$(get_password_alias "$var")

            # Only generate if we haven't generated this variable before
            if [[ ! -v "generated_values[$main_var]" ]]; then
                case $main_var in
                    "DJANGO_SECRET_KEY")
                        generated_values[$main_var]=$(generate_django_secret_key)
                        ;;
                    *)
                        generated_values[$main_var]=$(generate_secure_password)
                        ;;
                esac
                log "INFO" "Generated new value for $main_var"
            fi
            # Use the previously generated value
            value=${generated_values[$main_var]}
        fi

        # Store the value for this service
        service=$(echo "$service" | tr '[:upper:]' '[:lower:]')
        service_vars["$service"]+="$var=$value "
    done

    # Store all variables for each service in Vault
    for service in "${!service_vars[@]}"; do
        create_service_policy "$service" "kv/data/$service"
        create_approle "$service"
        log "INFO" "Storing credentials for service $service in Vault"
        docker exec tr_vault vault kv put "kv/$service" ${service_vars[$service]}
    done

    log "INFO" "Configuration complete. AppRole credentials are stored in ./data/credentials/"
    log "WARN" "Please secure the credentials directory and remove it after distributing credentials to services"
}

# Run main function
main

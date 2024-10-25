#!/usr/bin/env bash

set -eu
set -o pipefail
# --------------------------------------------------------
source "${BASH_SOURCE[0]%/*}"/lib.sh

# --------------------------------------------------------

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

    if [ "${SET_ENV:-0}" = "1" ]; then
        log_info "Using declare -x to set environment variables"
        eval "$(echo "$_secrets" | /vault/entrypoint/jq -r 'to_entries | .[] | "declare -x \(.key)=\(.value)"')"
    else
        log_info "Using export to set environment variables"
        eval "$(echo "$_secrets" | /vault/entrypoint/jq -r 'to_entries | .[] | "export \(.key)=\(.value)"')"
    fi
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
    VAULT_RESPONSE=$(/vault/entrypoint/curl -s \
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
    SECRETS=$(/vault/entrypoint/curl -s \
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

# Call main function with service name and path
log_info "Starting secrets fetch process"
fetch_vault_secrets "$SERVICE_NAME" "$SECRET_PATH"
log_info "Successfully completed secrets fetch process"

# --------------------------------------------------------
# Users declarations

declare -A users_passwords
users_passwords=(
	[logstash_internal]="${LOGSTASH_INTERNAL_PASSWORD:-}"
	[kibana_system]="${KIBANA_SYSTEM_PASSWORD:-}"
	[metricbeat_internal]="${METRICBEAT_INTERNAL_PASSWORD:-}"
	[filebeat_internal]="${FILEBEAT_INTERNAL_PASSWORD:-}"
	[heartbeat_internal]="${HEARTBEAT_INTERNAL_PASSWORD:-}"
	[monitoring_internal]="${MONITORING_INTERNAL_PASSWORD:-}"
	[beats_system]="${BEATS_SYSTEM_PASSWORD=:-}"
)

declare -A users_roles
users_roles=(
	[logstash_internal]='logstash_writer'
	[metricbeat_internal]='metricbeat_writer'
	[filebeat_internal]='filebeat_writer'
	[heartbeat_internal]='heartbeat_writer'
	[monitoring_internal]='remote_monitoring_collector'
)

# --------------------------------------------------------
# Roles declarations

declare -A roles_files
roles_files=(
	[logstash_writer]='logstash_writer.json'
	[metricbeat_writer]='metricbeat_writer.json'
	[filebeat_writer]='filebeat_writer.json'
	[heartbeat_writer]='heartbeat_writer.json'
)

# --------------------------------------------------------


log 'Waiting for availability of Elasticsearch. This can take several minutes.'

declare -i exit_code=0
wait_for_elasticsearch || exit_code=$?

if ((exit_code)); then
	case $exit_code in
		6)
			suberr 'Could not resolve host. Is Elasticsearch running?'
			;;
		7)
			suberr 'Failed to connect to host. Is Elasticsearch healthy?'
			;;
		28)
			suberr 'Timeout connecting to host. Is Elasticsearch healthy?'
			;;
		*)
			suberr "Connection to Elasticsearch failed. Exit code: ${exit_code}"
			;;
	esac

	exit $exit_code
fi

sublog 'Elasticsearch is running'

log 'Waiting for initialization of built-in users'

wait_for_builtin_users || exit_code=$?

if ((exit_code)); then
	suberr 'Timed out waiting for condition'
	exit $exit_code
fi

sublog 'Built-in users were initialized'

for role in "${!roles_files[@]}"; do
	log "Role '$role'"

	declare body_file
	body_file="${BASH_SOURCE[0]%/*}/roles/${roles_files[$role]:-}"
	if [[ ! -f "${body_file:-}" ]]; then
		sublog "No role body found at '${body_file}', skipping"
		continue
	fi

	sublog 'Creating/updating'
	ensure_role "$role" "$(<"${body_file}")"
done

for user in "${!users_passwords[@]}"; do
	log "User '$user'"
	if [[ -z "${users_passwords[$user]:-}" ]]; then
		sublog 'No password defined, skipping'
		continue
	fi

	declare -i user_exists=0
	user_exists="$(check_user_exists "$user")"

	if ((user_exists)); then
		sublog 'User exists, setting password'
		set_user_password "$user" "${users_passwords[$user]}"
	else
		if [[ -z "${users_roles[$user]:-}" ]]; then
			suberr '  No role defined, skipping creation'
			continue
		fi

		sublog 'User does not exist, creating'
		create_user "$user" "${users_passwords[$user]}" "${users_roles[$user]}"
	fi
done

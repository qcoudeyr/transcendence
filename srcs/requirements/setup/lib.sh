#!/usr/bin/env bash
# lib.sh

# Enhanced logging functions with timestamp and log levels
function log {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

function debug {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [DEBUG] $1"
    fi
}

function sublog {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]    ⠿ $1"
}

function err {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
}

function suberr {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]    ⠍ $1" >&2
}

# Enhanced wait_for_elasticsearch function with detailed logging
function wait_for_elasticsearch {
    local elasticsearch_host="${ELASTICSEARCH_HOST:-elasticsearch}"
    debug "Elasticsearch host: ${elasticsearch_host}"

    local -a args=( '-s' '-D-' '-m15' '-w' '%{http_code}' "http://${elasticsearch_host}:9200/" )

    if [[ -n "${ELASTIC_PASSWORD:-}" ]]; then
        debug "Using authentication with elastic user"
        args+=( '-u' "elastic:${ELASTIC_PASSWORD}" )
    else
        debug "No authentication configured"
    fi

    local -i result=1
    local output
    local -i attempt=1

    # retry for max 300s (60*5s)
    for _ in $(seq 1 60); do
        debug "Attempt ${attempt}/60 to connect to Elasticsearch"

        local -i exit_code=0
        local start_time=$(date +%s)
        output="$(curl "${args[@]}" 2>&1)" || exit_code=$?
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        if ((exit_code)); then
            debug "Curl command failed with exit code ${exit_code}"
            debug "Curl output: ${output}"
            result=$exit_code
        fi

        debug "HTTP response code: ${output: -3}"
        debug "Request took ${duration} seconds"

        if [[ "${output: -3}" -eq 200 ]]; then
            debug "Received HTTP 200 response"
            result=0
            break
        fi

        sublog "Attempt ${attempt}/60 failed. Waiting 5 seconds before retry..."
        sleep 5
        ((attempt++))
    done

    if ((result)); then
        if [[ "${output: -3}" -ne 000 ]]; then
            err "Failed to connect to Elasticsearch after ${attempt} attempts"
            echo -e "\nDetailed response:\n${output::-3}"
            debug "Final curl exit code: ${result}"
        fi
    else
        log "Successfully connected to Elasticsearch after ${attempt} attempts"
    fi

    return $result
}

# Enhanced wait_for_builtin_users function
function wait_for_builtin_users {
    local elasticsearch_host="${ELASTICSEARCH_HOST:-elasticsearch}"
    debug "Checking built-in users on host: ${elasticsearch_host}"

    local -a args=( '-s' '-D-' '-m15' "http://${elasticsearch_host}:9200/_security/user?pretty" )

    if [[ -n "${ELASTIC_PASSWORD:-}" ]]; then
        debug "Using authentication for user check"
        args+=( '-u' "elastic:${ELASTIC_PASSWORD}" )
    fi

    local -i result=1
    local -i attempt=1

    local line
    local -i exit_code
    local -i num_users

    # retry for max 30s (30*1s)
    for _ in $(seq 1 30); do
        debug "Attempt ${attempt}/30 to check built-in users"
        num_users=0

        while IFS= read -r line || ! exit_code="$line"; do
            if [[ "$line" =~ _reserved.+true ]]; then
                ((num_users++))
                debug "Found reserved user: ${line}"
            fi
        done < <(curl "${args[@]}"; printf '%s' "$?")

        if ((exit_code)); then
            debug "Curl command failed with exit code ${exit_code}"
            result=$exit_code
        fi

        debug "Found ${num_users} reserved users"

        if (( num_users > 1 )); then
            debug "Successfully found ${num_users} built-in users"
            result=0
            break
        fi

        sublog "Attempt ${attempt}/30: Found only ${num_users} users. Waiting 1 second before retry..."
        sleep 1
        ((attempt++))
    done

    if ((result)); then
        err "Failed to find expected number of built-in users after ${attempt} attempts"
        debug "Last exit code: ${result}"
    else
        log "Successfully verified built-in users after ${attempt} attempts"
    fi

    return $result
}

# Verify that the given Elasticsearch user exists.
function check_user_exists {
	local username=$1

	local elasticsearch_host="${ELASTICSEARCH_HOST:-elasticsearch}"

	local -a args=( '-s' '-D-' '-m15' '-w' '%{http_code}'
		"http://${elasticsearch_host}:9200/_security/user/${username}"
		)

	if [[ -n "${ELASTIC_PASSWORD:-}" ]]; then
		args+=( '-u' "elastic:${ELASTIC_PASSWORD}" )
	fi

	local -i result=1
	local -i exists=0
	local output

	output="$(curl "${args[@]}")"
	if [[ "${output: -3}" -eq 200 || "${output: -3}" -eq 404 ]]; then
		result=0
	fi
	if [[ "${output: -3}" -eq 200 ]]; then
		exists=1
	fi

	if ((result)); then
		echo -e "\n${output::-3}"
	else
		echo "$exists"
	fi

	return $result
}

# Set password of a given Elasticsearch user.
function set_user_password {
	local username=$1
	local password=$2

	local elasticsearch_host="${ELASTICSEARCH_HOST:-elasticsearch}"

	local -a args=( '-s' '-D-' '-m15' '-w' '%{http_code}'
		"http://${elasticsearch_host}:9200/_security/user/${username}/_password"
		'-X' 'POST'
		'-H' 'Content-Type: application/json'
		'-d' "{\"password\" : \"${password}\"}"
		)

	if [[ -n "${ELASTIC_PASSWORD:-}" ]]; then
		args+=( '-u' "elastic:${ELASTIC_PASSWORD}" )
	fi

	local -i result=1
	local output

	output="$(curl "${args[@]}")"
	if [[ "${output: -3}" -eq 200 ]]; then
		result=0
	fi

	if ((result)); then
		echo -e "\n${output::-3}\n"
	fi

	return $result
}

# Create the given Elasticsearch user.
function create_user {
	local username=$1
	local password=$2
	local role=$3

	local elasticsearch_host="${ELASTICSEARCH_HOST:-elasticsearch}"

	local -a args=( '-s' '-D-' '-m15' '-w' '%{http_code}'
		"http://${elasticsearch_host}:9200/_security/user/${username}"
		'-X' 'POST'
		'-H' 'Content-Type: application/json'
		'-d' "{\"password\":\"${password}\",\"roles\":[\"${role}\"]}"
		)

	if [[ -n "${ELASTIC_PASSWORD:-}" ]]; then
		args+=( '-u' "elastic:${ELASTIC_PASSWORD}" )
	fi

	local -i result=1
	local output

	output="$(curl "${args[@]}")"
	if [[ "${output: -3}" -eq 200 ]]; then
		result=0
	fi

	if ((result)); then
		echo -e "\n${output::-3}\n"
	fi

	return $result
}

# Ensure that the given Elasticsearch role is up-to-date, create it if required.
function ensure_role {
	local name=$1
	local body=$2

	local elasticsearch_host="${ELASTICSEARCH_HOST:-elasticsearch}"

	local -a args=( '-s' '-D-' '-m15' '-w' '%{http_code}'
		"http://${elasticsearch_host}:9200/_security/role/${name}"
		'-X' 'POST'
		'-H' 'Content-Type: application/json'
		'-d' "$body"
		)

	if [[ -n "${ELASTIC_PASSWORD:-}" ]]; then
		args+=( '-u' "elastic:${ELASTIC_PASSWORD}" )
	fi

	local -i result=1
	local output

	output="$(curl "${args[@]}")"
	if [[ "${output: -3}" -eq 200 ]]; then
		result=0
	fi

	if ((result)); then
		echo -e "\n${output::-3}\n"
	fi

	return $result
}

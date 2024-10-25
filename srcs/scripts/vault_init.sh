#!/bin/bash

# Function to check if a GPG key with the specified name already exists
check_gpg_key() {
    # Look for the specified key (vault-key)
    KEY_EXISTS=$(gpg --list-keys "vault-key" 2>/dev/null)

    if [[ -z "$KEY_EXISTS" ]]; then
        echo "No GPG key with name 'vault-key' found. Generating a new key..."
        generate_gpg_key
    else
        echo "GPG key 'vault-key' already exists. Skipping key generation."
    fi
}

# Function to generate a new GPG key
generate_gpg_key() {
    echo "Generating a new GPG key named 'vault-key'. You will be prompted for a passphrase."

    # GPG key generation process
    gpg --batch --gen-key <<EOF
    Key-Type: RSA
    Key-Length: 2048
    Name-Real: vault-key
    Name-Email: vault-key@example.com
    Name-Comment: vault-key
    Expire-Date: 0
    Passphrase: $(read -s -p "Enter passphrase for GPG key: " passphrase; echo $passphrase)
EOF
}

# Function to get the GPG key ID for 'vault-key'
get_gpg_key_id() {
    gpg --list-keys --with-colons "vault-key" | grep "^pub" | cut -d':' -f5
}

# Initialize Vault and capture the unseal keys and root token
VAULT_INIT=$(docker exec tr_vault vault operator init -format=json)

# Ensure we capture valid JSON output and check for errors
if [[ $? -ne 0 ]]; then
    echo "Error: Vault initialization failed."
    exit 1
fi

# Extract the root token and the five unseal keys from the JSON output
ROOT_TOKEN=$(echo $VAULT_INIT | jq -r '.root_token')
UNSEAL_KEY_1=$(echo $VAULT_INIT | jq -r '.unseal_keys_b64[0]')
UNSEAL_KEY_2=$(echo $VAULT_INIT | jq -r '.unseal_keys_b64[1]')
UNSEAL_KEY_3=$(echo $VAULT_INIT | jq -r '.unseal_keys_b64[2]')
UNSEAL_KEY_4=$(echo $VAULT_INIT | jq -r '.unseal_keys_b64[3]')
UNSEAL_KEY_5=$(echo $VAULT_INIT | jq -r '.unseal_keys_b64[4]')

# Check if the keys and root token were extracted properly
if [[ -z "$ROOT_TOKEN" || -z "$UNSEAL_KEY_1" || -z "$UNSEAL_KEY_2" || -z "$UNSEAL_KEY_3" ]]; then
    echo "Error: Failed to extract Vault keys or root token."
    exit 1
fi

# Unseal Vault using the first three keys (minimum quorum is 3 by default)
docker exec tr_vault vault operator unseal $UNSEAL_KEY_1
docker exec tr_vault vault operator unseal $UNSEAL_KEY_2
docker exec tr_vault vault operator unseal $UNSEAL_KEY_3

# Login to Vault using the root token
docker exec tr_vault vault login $ROOT_TOKEN

# Check for existing GPG key, or generate a new one if none exists
check_gpg_key

# Get the GPG key ID for the 'vault-key'
GPG_KEY_ID=$(get_gpg_key_id)

if [[ -z "$GPG_KEY_ID" ]]; then
    echo "Error: Failed to retrieve the GPG key ID for 'vault-key'."
    exit 1
fi

# Prepare the data for encryption (unseal keys and root token)
VAULT_KEYS=$(cat <<EOF
Root Token: $ROOT_TOKEN
Unseal Key 1: $UNSEAL_KEY_1
Unseal Key 2: $UNSEAL_KEY_2
Unseal Key 3: $UNSEAL_KEY_3
Unseal Key 4: $UNSEAL_KEY_4
Unseal Key 5: $UNSEAL_KEY_5
EOF
)

# Encrypt the data using GPG with the specified key ID
echo "$VAULT_KEYS" | gpg --encrypt --recipient "$GPG_KEY_ID" --output vault_root_token.gpg

# Notify the user that the encryption is complete
echo "Vault keys have been encrypted and saved to vault_root_token.gpg."

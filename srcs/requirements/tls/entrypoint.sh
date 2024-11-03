#!/usr/bin/env bash

set -eu
set -o pipefail

declare symbol=⠍

echo '[+] CA certificate and key'

if [ ! -f tls/certs/ca/ca.key ]; then
	symbol=⠿

	bin/elasticsearch-certutil ca \
		--silent \
		--pem \
		--out tls/certs/ca.zip

	unzip tls/certs/ca.zip -d tls/certs/ >/dev/null
	rm tls/certs/ca.zip

	echo '   ⠿ Created'
else
	echo '   ⠍ Already present, skipping'
fi

declare ca_fingerprint
ca_fingerprint="$(openssl x509 -fingerprint -sha256 -noout -in tls/certs/ca/ca.crt \
	| cut -d '=' -f2 \
	| tr -d ':' \
	| tr '[:upper:]' '[:lower:]'
)"

echo "   ${symbol} SHA256 fingerprint: ${ca_fingerprint}"

while IFS= read -r file; do
	echo "   ${symbol}   ${file}"
done < <(find tls/certs/ca -type f \( -name '*.crt' -or -name '*.key' \) -mindepth 1 -print)

symbol=⠍

echo '[+] Server certificates and keys'

if [ ! -f tls/certs/elasticsearch/elasticsearch.key ]; then
	symbol=⠿

	bin/elasticsearch-certutil cert \
		--silent \
		--pem \
		--in tls/instances.yml \
		--ca-cert tls/certs/ca/ca.crt \
		--ca-key tls/certs/ca/ca.key \
		--out tls/certs/certs.zip

	unzip tls/certs/certs.zip -d tls/certs/ >/dev/null
	rm tls/certs/certs.zip

	find tls -name ca -prune -or -type f -name '*.crt' -exec sh -c 'cat tls/certs/ca/ca.crt >>{}' \;

	echo '   ⠿ Created'
else
	echo '   ⠍ Already present, skipping'
fi

while IFS= read -r file; do
	echo "   ${symbol}   ${file}"
done < <(find tls -name ca -prune -or -type f \( -name '*.crt' -or -name '*.key' \) -mindepth 1 -print)

#!/usr/bin/env bash

declare symbol=⠍
declare -r CERT_DIR="tls/certs"
declare -r CA_DIR="${CERT_DIR}/ca"
declare -r DAYS_VALID=365
declare -r KEY_SIZE=4096

# Create necessary directories
mkdir -p "${CA_DIR}"

echo '[+] CA certificate and key'

if [ ! -f "${CA_DIR}/ca.key" ]; then
    symbol=⠿

    # Generate CA private key
    openssl genrsa -out "${CA_DIR}/ca.key" ${KEY_SIZE}

    # Generate CA certificate
    openssl req -x509 -new -nodes \
        -key "${CA_DIR}/ca.key" \
        -sha256 -days ${DAYS_VALID} \
        -out "${CA_DIR}/ca.crt" \
        -subj "/C=FR/ST=PO/L=Perpignan/O=42/OU=42/CN=Transcendence CA"

    echo '   ⠿ Created CA certificate and key'
else
    echo '   ⠍ CA already present, skipping'
fi

# Display CA fingerprint
declare ca_fingerprint
ca_fingerprint="$(openssl x509 -fingerprint -sha256 -noout -in ${CA_DIR}/ca.crt \
    | cut -d '=' -f2 \
    | tr -d ':' \
    | tr '[:upper:]' '[:lower:]'
)"

echo "   ${symbol} SHA256 fingerprint: ${ca_fingerprint}"

# Function to generate certificates for a service
generate_service_cert() {
    local service_name=$1
    local service_dir="${CERT_DIR}/${service_name}"

    mkdir -p "${service_dir}"

    if [ ! -f "${service_dir}/${service_name}.key" ]; then
        echo "   ⠿ Generating certificates for ${service_name}"

        # Generate private key
        openssl genrsa -out "${service_dir}/${service_name}.key" ${KEY_SIZE}

        # Generate CSR config
        cat > "${service_dir}/${service_name}.conf" <<EOF
[req]
default_bits = ${KEY_SIZE}
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = FR
ST = PO
L = Perpignan
O = 42
OU = 42
CN = ${service_name}

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${service_name}
DNS.2 = tr_${service_name}
IP.1 = 127.0.0.1
EOF

        # Generate CSR
        openssl req -new -key "${service_dir}/${service_name}.key" \
            -out "${service_dir}/${service_name}.csr" \
            -config "${service_dir}/${service_name}.conf"

        # Generate certificate
        openssl x509 -req \
            -in "${service_dir}/${service_name}.csr" \
            -CA "${CA_DIR}/ca.crt" \
            -CAkey "${CA_DIR}/ca.key" \
            -CAcreateserial \
            -out "${service_dir}/${service_name}.crt" \
            -days ${DAYS_VALID} \
            -sha256 \
            -extensions req_ext \
            -extfile "${service_dir}/${service_name}.conf"

        # Append CA cert to service cert for chain of trust
        cat "${CA_DIR}/ca.crt" >> "${service_dir}/${service_name}.crt"

        # Clean up CSR and config
        rm "${service_dir}/${service_name}.csr" "${service_dir}/${service_name}.conf"

		if [ "${service_name}" == "nginx" ]; then
			chmod 664 "${service_dir}"/* --recursive
		fi

        echo "   ⠿ Created certificates for ${service_name}"
    else
        echo "   ⠍ Certificates for ${service_name} already present, skipping"
    fi
}

echo '[+] Service certificates and keys'

# Generate certificates for each service
for service in django channels postgresql nginx redis; do
    generate_service_cert "${service}"
done

# Display all generated files
echo '[+] Generated files:'
while IFS= read -r file; do
    echo "   ⠿   ${file}"
done < <(find ${CERT_DIR} -type f \( -name '*.crt' -or -name '*.key' \) -mindepth 1 -print)

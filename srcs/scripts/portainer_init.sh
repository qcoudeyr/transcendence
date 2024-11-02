#!/bin/bash

# Path to the portainer.db file
DB_FILE="./srcs/data/portainer_data/portainer.db"

# URL to check
URL="https://portainer.pong-br.com/api/users/admin/init"

# Check if the URL is reachable
if curl --output /dev/null --silent --head --connect-timeout 5 "$URL"; then
	echo "URL is reachable."
else
	echo "URL is not reachable. Exiting."
	exit 1
fi

# Check if the file exists
if [ ! -f "$DB_FILE" ]; then
	# File does not exist, execute the curl command
	echo "Initialization of Portainer."
	curl 'https://portainer.pong-br.com/api/users/admin/init' \
		-H 'Referer: https://portainer.pong-br.com/' \
		-H 'Accept: application/json, text/plain, */*' \
		-H 'Content-Type: application/json' \
		--data-raw '{"Username":"transcendence","Password":"transcendence"}' > /dev/null
	echo "Portainer initialized!"
else
	echo "Portainer is already initialized."
fi

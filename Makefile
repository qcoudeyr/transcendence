SHELL := /bin/bash

all: create-data-dirs ssl-cert init-vault build-and-up init-portainer

create-data-dirs:
	@echo "Creating data directories if they do not exist..."

	@mkdir ./srcs/data/django_data \
		./srcs/data/portainer_data \
		./srcs/data/postgres_data \
		./srcs/data/vault_data \
		./srcs/data/website_data \
		./srcs/data/redis_data \
		./srcs/data/elasticsearch_data \
		./srcs/data/apm_server_data \
		./srcs/data/fleet_server_data \
		./srcs/data/grafana_data \
		./srcs/data/logs \
		./srcs/data/certbot \
		./srcs/data/certbot/logs \
		./srcs/data/certificates > /dev/null 2>&1 || true
	@echo "Data directories created."

build-and-up:
	@cd ./srcs && docker compose up tls; \
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "TLS setup done, continuing without sleep..."; \
	else \
		echo "TLS setup failed, sleeping for 15 seconds..."; \
		sleep 15; \
	fi
	@cd ./srcs && docker compose up setup && docker compose up -d
	@echo "Build Complete !"


init-portainer:
	@echo "Starting of the init scripts..."
	@echo "Portainer init started..."
	@./srcs/scripts/portainer_init.sh; \
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "Portainer init done!"; \
	else \
		echo "Portainer init script failed with return value $$R_VALUE!"; \
	fi || true

init-vault:
	@echo "Starting of the init scripts..."
	@cd ./srcs && ./scripts/tls_setup.sh; \
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "Vault init done!"; \
	else \
		echo "Vault init script failed with return value $$R_VALUE!"; \
	fi
	@echo "Starting Vault container..."
	@cd ./srcs && docker compose up vault -d
	@echo "Vault container started !"
	@echo "Vault initialization started..."
	@cd ./srcs && ./scripts/vault_init.sh; \
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "Vault init done!"; \
	else \
		echo "Vault init script failed with return value $$R_VALUE!"; \
	fi
	@echo "Vault setup started..."
	@cd ./srcs && ./scripts/vault_setup.sh; \
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "Vault setup done!"; \
	else \
		echo "Vault setup script failed with return value $$R_VALUE!"; \
	fi

clean-sensitive-data:
	@echo "Cleaning up sensitive data..."
	@GPG_FINGERPRINT=$$(gpg --list-keys --with-colons "vault-key" | grep "^fpr" | cut -d':' -f10) && \
	if [ -n "$$GPG_FINGERPRINT" ]; then \
		gpg --batch --yes --delete-secret-keys "$$GPG_FINGERPRINT" && \
		if [ $$? -eq 0 ]; then \
			echo "GPG secret key '$$GPG_FINGERPRINT' removed successfully."; \
		else \
			echo "Failed to remove GPG secret key."; \
		fi; \
	else \
		echo "No GPG secret key found for 'vault-key'."; \
	fi
	@GPG_FINGERPRINT=$$(gpg --list-keys --with-colons "vault-key" | grep "^fpr" | cut -d':' -f10) && \
	if [ -n "$$GPG_FINGERPRINT" ]; then \
		gpg --batch --yes --delete-keys "$$GPG_FINGERPRINT" && \
		if [ $$? -eq 0 ]; then \
			echo "GPG public key '$$GPG_FINGERPRINT' removed successfully."; \
		else \
			echo "Failed to remove GPG public key."; \
		fi; \
	else \
		echo "No GPG public key found for 'vault-key'."; \
	fi
	@rm -rf ./srcs/vault_root_token.gpg \
	./srcs/requirements/vault/certs/ ./srcs/requirements/tls/certs/ && \
	if [ $$? -eq 0 ]; then \
		echo "Encrypted file 'vault_root_token.gpg' removed successfully."; \
	else \
		echo "Failed to remove 'root_token.gpg'."; \
	fi

clean-ssl:
	@echo "Cleaning up ssl certificates..."
	@find ./srcs/data -type d -name 'certs' -exec rm -rf {} + && \
	if [ $$? -eq 0 ]; then \
		echo "All 'certs' directories removed successfully."; \
	else \
		echo "Failed to remove some 'certs' directories."; \
	fi
	@rm -rf ./srcs/data/certificates/nginx ./srcs/data/certificates/vault ./srcs/data/certificates/root-ca.*
	@echo "Sensitive data cleanup complete."

fclean: clean-data clean-sensitive-data clean-ssl
	@echo "Removing migrations..."
	@docker exec tr_django remove_migrations.sh || true
	@docker exec tr_channels remove_migrations.sh || true
	@echo "Stopping and removing all Docker containers..."
	@cd ./srcs &&  docker-compose down --volumes --remove-orphans || true
	@docker stop $$(docker ps -q) || true
	@docker rm $$(docker ps -a -q) || true
	@echo "Removing all Docker images..."
	@docker rmi $$(docker images -q) || true
	@echo "Removing all Docker volumes..."
	@docker volume rm $$(docker volume ls -q) || true
	@echo "Removing all Docker networks..."
	@docker network rm $$(docker network ls -q) || true
	@echo "Removing database..."
	@sudo rm -rf ./srcs/data/postgres_data
	@sudo rm -rf ./srcs/data/elasticsearch_data
	@sudo rm -rf ./srcs/data/apm_server_data
	@sudo rm -rf ./srcs/data/fleet_server_data
	@echo "Cleanup complete."

stop-docker:
	@echo "Stopping Docker daemon and all containers..."
	@sudo systemctl stop docker* > /dev/null 2>&1
	@echo "All Docker containers stopped!"

start-docker:
	@echo "Starting Docker daemon..."
	@sudo systemctl start docker.service docker.socket > /dev/null 2>&1
	@echo "Docker daemon started!"

clean-data:
	@echo "Cleaning of the data folder..."
	@sudo find srcs/data -mindepth 1 -maxdepth 1 ! -name 'django_data' ! -name 'media_data' ! -name 'website_data' ! -name 'channels_data' -exec rm -rf {} +
	@echo "Cleaning done !"

restart-docker:
	@if [ -z "$(container)" ]; then \
		echo "Restarting all Docker containers..."; \
		docker restart $$(docker ps -q) > /dev/null 2>&1; \
		echo "All Docker containers have been restarted."; \
	else \
		if docker ps -a --format '{{.Names}}' | grep -q "^$(container)$$"; then \
			echo "Restarting Docker container '$(container)'..."; \
			docker restart $(container) > /dev/null 2>&1; \
			echo "Docker container '$(container)' has been restarted."; \
		else \
			echo "Error: Docker container '$(container)' not found."; \
			echo "Here is the list of available containers to restart:"; \
			docker ps -a --format '{{.Names}}'; \
			exit 1; \
		fi \
	fi
%:
	@$(MAKE) restart-docker container=$@



# Add this to your existing Makefile
show-vault-token:
	@if [ ! -f ./srcs/vault_root_token.gpg ]; then \
		echo "Error: Encrypted token file not found at ./srcs/vault_root_token.gpg"; \
		exit 1; \
	fi
	@# Decrypt and display first line only, immediately clear from memory
	@gpg --quiet --decrypt ./srcs/vault_root_token.gpg 2>/dev/null | head -n1 | tr -d '\n' | \
	{ read token; \
		clear; \
		tput cup 0 0; \
		echo "Vault Token (will clear in 10 seconds):"; \
		echo "$$token"; \
		sleep 10; \
		clear; \
		tput cup 0 0; \
		echo "Token cleared from screen."; \
	}



# Generate SSL certificates if not present
ssl-cert: create-data-dirs
	@echo "🔍 Checking for existing SSL certificates..."
	@if [ -d "./srcs/data/certbot/certificates/pong-br.com/" ]; then \
		echo "✅ SSL certificates already exist. Skipping generation."; \
	else \
		if [ -d ".backup/data/certbot/certificates/pong-br.com" ]; then \
			docker compose -f ./srcs/docker-compose.yml up certbot -d || { echo "❌ Failed to start certbot container"; exit 1; }; \
			echo "📁 Restoring backup SSL certificates..."; \
			cp -R ./.backup/data/certbot/certificates/pong-br.com/ ./srcs/data/certbot/certificates/; \
		else \
			echo "🔐 Generating new SSL certificates..."; \
			cd ./srcs && docker compose up certbot -d || { echo "❌ Failed to start certbot container"; exit 1; }; \
			echo "⏳ Waiting for certbot container to initialize..."; \
			sleep 2; \
			echo "🔑 Running certificate generation..."; \
			docker exec tr_certbot /bin/sh -c "certbot certonly \
			--dns-luadns \
			--dns-luadns-credentials /.secrets/certbot/luadns.ini \
			--email admin@pong-br.com \
			--agree-tos \
			--no-eff-email \
			-d pong-br.com \
			-d test.pong-br.com"; \
			if [ $$? -ne 0 ]; then \
				echo "❌ Certificate generation failed"; \
				exit 1; \
			fi; \
			echo "📂 Setting permissions on certificate files..."; \
			chmod 755 --recursive ./data/certbot/certificates/pong-br.com/ || { echo "❌ Failed to set permissions"; exit 1; }; \
			echo "✅ SSL certificate generation completed successfully."; \
		fi; \
	fi

# Force renewal of certificates
ssl-renew:
	docker compose run --rm certbot certbot renew --force-renewal


re: fclean all

.PHONY: all build-and-up ssl-cert ssl-renew fclean re restart-docker stop-docker start-docker setup show-vault-token

# Color and formatting definitions
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m
BOLD := \033[1m

# Environment variables
ENABLE_DEVOPS ?= false
DEV=1

# Existing variables
SHELL := /bin/bash
NETWORK_NAME = tr_network
NETWORK_SUBNET = 10.0.10.0/24
NETWORK_DRIVER = bridge

all:  create-data-dirs init-network ssl-cert init-vault build-and-up init-portainer


create-data-dirs:
	$(call log_info,"Creating data directories...")
	@mkdir -p ./srcs/data/django_data \
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
	$(call log_success,"Data directories created successfully")

init-network:
	@echo "🔍 Checking for existing Docker network $(NETWORK_NAME)..."
	@if docker network inspect $(NETWORK_NAME) >/dev/null 2>&1; then \
		echo "ℹ️  Network $(NETWORK_NAME) already exists"; \
	else \
		echo "🌐 Creating new Docker network: $(NETWORK_NAME)"; \
		echo "📝 Configuration:"; \
		echo "   • Driver: $(NETWORK_DRIVER)"; \
		echo "   • Subnet: $(NETWORK_SUBNET)"; \
		if docker network create --driver $(NETWORK_DRIVER) --subnet $(NETWORK_SUBNET) $(NETWORK_NAME) >/dev/null 2>&1; then \
			echo "✅ Network created successfully!"; \
		else \
			echo "❌ Failed to create network"; \
			exit 1; \
		fi; \
	fi

build-and-up:
	@echo "🔐 Starting TLS setup..."
	@docker compose -f ./srcs/docker-compose.yml up tls; \
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "✅ TLS setup completed successfully"; \
	else \
		echo "⚠️  TLS setup failed, waiting 15 seconds..."; \
		sleep 15; \
	fi; \
	echo "🚀 Starting main services..."; \
	if [ "$(ENABLE_DEVOPS)" = "true" ]; then \
		echo "⚙️  DevOps services enabled, starting setup..."; \
		docker compose -f ./srcs/devops-docker-compose.yml up setup && \
		docker compose -f ./srcs/docker-compose.yml -f ./srcs/devops-docker-compose.yml up -d; \
	else \
		echo "ℹ️  DevOps services disabled, starting only main services..."; \
		docker compose -f ./srcs/docker-compose.yml up -d; \
	fi; \
	sleep 5 && docker exec tr_nginx rm /etc/nginx/conf.d/modsecurity.conf && docker exec tr_nginx nginx -s reload || true; \
	echo "✨ Build Complete!"

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

init-vault:  init-network
	@echo "Starting of the tls scripts..."
	@./srcs/scripts/tls_setup.sh;\
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "Vault tls done!"; \
	else \
		echo "Vault tls script failed with return value $$R_VALUE!"; \
	fi
	@echo "Starting Vault container..."
	@docker compose -f ./srcs/docker-compose.yml up vault -d
	@echo "Vault container started !"
	@echo "Vault initialization started..."
	@DEV=$(DEV) ./srcs/scripts/vault_init.sh; \
	R_VALUE=$$?; \
	if [ $$R_VALUE -eq 0 ]; then \
		echo "Vault init done!"; \
	else \
		echo "Vault init script failed with return value $$R_VALUE!"; \
	fi
	@echo "Vault setup started..."
	@./srcs/scripts/vault_setup.sh; \
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
	@docker compose -f ./srcs/docker-compose.yml -f ./srcs/devops-docker-compose.yml down --volumes --remove-orphans || true
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

clean-data:
	@echo "Cleaning of the data folder..."
	@sudo find srcs/data -mindepth 1 -maxdepth 1 ! -name 'django_data' ! -name 'media_data' ! -name 'website_data' ! -name 'channels_data' -exec rm -rf {} +
	@echo "Cleaning done !"


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
			docker compose -f ./srcs/docker-compose.yml up certbot -d || { echo "❌ Failed to start certbot container"; exit 1; }; \
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
			chmod 644 --recursive ./data/certbot/certificates/pong-br.com/ || { echo "❌ Failed to set permissions"; exit 1; }; \
			echo "✅ SSL certificate generation completed successfully."; \
		fi; \
	fi

# Force renewal of certificates
ssl-renew:
	docker compose -f ./srcs/docker-compose.yml run --rm certbot certbot renew --force-renewal

re: fclean all

.PHONY: all build-and-up ssl-cert ssl-renew fclean re show-vault-token


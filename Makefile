# Color and formatting definitions
YELLOW := $(shell printf "\033[33m")
GREEN := $(shell printf "\033[32m")
RED := $(shell printf "\033[31m")
BLUE := $(shell printf "\033[34m")
NC := $(shell printf "\033[0m")

# Environment variables
ENABLE_DEVOPS ?= false
DEV=1
CERT_SOURCE_DIR := ./srcs/data/certbot/certificates/pong-br.com
BACKUP_DIR := ./.backup/data/certbot/certificates/pong-br.com
# Existing variables
SHELL := /bin/bash
NETWORK_NAME = tr_network
NETWORK_DEVOPS_NAME = tr_devops_network
NETWORK_SUBNET = 10.0.10.0/27
NETWORK_DEVOPS_SUBNET = 10.0.10.32/27
NETWORK_DRIVER = bridge

all:  create-data-dirs init-network ssl-cert backup init-vault build-and-up init-portainer


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
		./srcs/data/certificates \
		./srcs/data/certbot/certificates/ \
		> /dev/null 2>&1 || true
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
			echo "✅ Network $(NETWORK_NAME) created successfully!"; \
		else \
			echo "❌ Failed to create network $(NETWORK_NAME)"; \
			exit 1; \
		fi; \
	fi

	@echo "🔍 Checking for existing Docker network $(NETWORK_DEVOPS_NAME)..."
	@if docker network inspect $(NETWORK_DEVOPS_NAME) >/dev/null 2>&1; then \
		echo "ℹ️  Network $(NETWORK_DEVOPS_NAME) already exists"; \
	else \
		echo "🌐 Creating new Docker network: $(NETWORK_DEVOPS_NAME)"; \
		echo "📝 Configuration:"; \
		echo "   • Driver: $(NETWORK_DRIVER)"; \
		echo "   • Subnet: $(NETWORK_DEVOPS_SUBNET)"; \
		if docker network create --driver $(NETWORK_DRIVER) --subnet $(NETWORK_DEVOPS_SUBNET) $(NETWORK_DEVOPS_NAME) >/dev/null 2>&1; then \
			echo "✅ Network $(NETWORK_DEVOPS_NAME) created successfully!"; \
		else \
			echo "❌ Failed to create network $(NETWORK_DEVOPS_NAME)"; \
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
	fi;
	echo "✨ Build Complete!"

devops:
	@echo "🚀 Starting DevOps services...";
	@echo "⚙️  DevOps services enabled, starting setup...";
	@docker compose -f ./srcs/devops-docker-compose.yml up setup && \
	 docker compose -f ./srcs/devops-docker-compose.yml up -d;

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
		sleep 5 ;\
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
			docker compose -f ./srcs/docker-compose.yml up certbot -d || { echo "❌ Failed to start certbot container"; exit 1; } && \
			echo "📁 Restoring backup SSL certificates..." && \
			sleep 5 && \
			cp -r ./.backup/data/certbot/ ./srcs/data/ && \
			chmod 777 --recursive ./srcs/data/certbot/certificates/; \
		else \
			echo "🔐 Generating new SSL certificates..." && \
			docker compose -f ./srcs/docker-compose.yml up certbot -d || { echo "❌ Failed to start certbot container"; exit 1; } && \
			echo "⏳ Waiting for certbot container to initialize..." && \
			sleep 2 && \
			echo "🔑 Running certificate generation..." && \
			docker exec tr_certbot /bin/sh -c "certbot certonly \
				--dns-luadns \
				--dns-luadns-credentials /.secrets/certbot/luadns.ini \
				--email admin@pong-br.com \
				--agree-tos \
				--no-eff-email \
				-d pong-br.com \
				-d portainer.pong-br.com \
				-d vault.pong-br.com \
				-d grafana.pong-br.com \
				-d kibana.pong-br.com " && \
			echo "📂 Setting permissions on certificate files..." && \
			chmod 777 --recursive ./srcs/data/certbot/certificates/ || { echo "❌ Failed to set permissions"; exit 1; } && \
			echo "✅ SSL certificate generation completed successfully."; \
		fi; \
	fi

backup:
	@echo "${BLUE}🔍 Checking for files to backup...${NC}"
	@if [ ! -d "$(CERT_SOURCE_DIR)" ]; then \
		echo "${RED}❌ Error: Source directory $(CERT_SOURCE_DIR) does not exist!${NC}"; \
		echo "${YELLOW}ℹ️  Please ensure the certificates are generated first.${NC}"; \
		exit 1; \
	fi
	@echo "${BLUE}📂 Source directory found. Preparing backup...${NC}"
	@if [ ! -d "$(BACKUP_DIR)" ]; then \
		echo "${YELLOW}📁 Creating backup directory structure...${NC}"; \
		mkdir -p "$(BACKUP_DIR)" 2>/dev/null || \
		{ echo "${RED}❌ Error: Failed to create backup directory!${NC}"; exit 1; }; \
	fi
	@echo "${BLUE}📦 Starting backup process...${NC}"
	@cp -r "$(CERT_SOURCE_DIR)/." "$(BACKUP_DIR)/" 2>/dev/null || \
		{ echo "${RED}❌ Error: Failed to copy files!${NC}"; \
		  echo "${YELLOW}ℹ️  Please check permissions and disk space.${NC}"; \
		  exit 1; }
	@if [ -d "$(BACKUP_DIR)" ] && [ "$$(ls -A "$(BACKUP_DIR)" 2>/dev/null)" ]; then \
		echo "${GREEN}✅ Backup completed successfully!${NC}"; \
		echo "${BLUE}📍 Backup location: $(BACKUP_DIR)${NC}"; \
		echo "${YELLOW}ℹ️  Total files backed up: $$(find "$(BACKUP_DIR)" -type f | wc -l)${NC}"; \
	else \
		echo "${RED}❌ Error: Backup appears to be empty or incomplete!${NC}"; \
		exit 1; \
	fi

# Force renewal of certificates
ssl-renew:
	docker compose -f ./srcs/docker-compose.yml run --rm certbot certbot renew --force-renewal

re: fclean all

.PHONY: all build-and-up ssl-cert ssl-renew fclean re show-vault-token


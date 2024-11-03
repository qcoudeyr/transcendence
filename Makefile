# Color and formatting definitions
YELLOW := $(shell printf "\033[33m")
GREEN := $(shell printf "\033[32m")
RED := $(shell printf "\033[31m")
BLUE := $(shell printf "\033[34m")
NC := $(shell printf "\033[0m")

# Environment variables
ENABLE_DEVOPS ?= true
DEV=1
CERT_SOURCE_DIR := ./srcs/data/certbot/certificates/pong-br.com
BACKUP_DIR := ./.backup/data/certbot/certificates/pong-br.com
PROJECT_IMAGES := tr_django tr_nginx tr_postgres tr_redis tr_vault tr_channels tr_certbot tr_portainer tr_elasticsearch tr_apm-server tr_fleet-server tr_grafana
SHELL := /bin/bash
NETWORK_NAME = tr_network
NETWORK_DEVOPS_NAME = tr_devops_network
NETWORK_SUBNET = 10.0.10.0/27
NETWORK_DEVOPS_SUBNET = 10.0.10.32/27
NETWORK_DRIVER = bridge

all:  create-data-dirs init-network ssl-cert backup init-vault build-and-up init-portainer

define check_directory
	@if [ ! -d "$(1)" ]; then \
		echo "$(RED)❌ Directory $(1) not found!$(NC)"; \
		echo "$(YELLOW)ℹ️  Creating directory...$(NC)"; \
		mkdir -p $(1) || { echo "$(RED)❌ Failed to create directory$(NC)"; exit 1; }; \
	fi
endef

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

init-vault: init-network
	@echo "🔐 Starting Vault initialization process..."
	@echo "📝 Configuration:"
	@echo "   • Dev Mode: $(DEV)"
	@echo "   • Scripts Path: ./srcs/scripts/"

	@# Vérification des scripts nécessaires
	@for script in tls_setup.sh vault_init.sh vault_setup.sh; do \
		if [ ! -f "./srcs/scripts/$$script" ]; then \
			echo "$(RED)❌ Required script $$script not found!$(NC)"; \
			exit 1; \
		fi; \
	done

	@echo "🔒 Setting up TLS..."
	@./srcs/scripts/tls_setup.sh || { \
		echo "$(RED)❌ TLS setup failed$(NC)"; \
		exit 1; \
	}

	@echo "🚀 Starting Vault container..."
	@docker compose -f ./srcs/docker-compose.yml up vault -d || { \
		echo "$(RED)❌ Failed to start Vault container$(NC)"; \
		exit 1; \
	}

	@echo "⚙️  Initializing Vault..."
	@DEV=$(DEV) ./srcs/scripts/vault_init.sh || { \
		echo "$(RED)❌ Vault initialization failed$(NC)"; \
		exit 1; \
	}

	@echo "🔧 Configuring Vault..."
	@./srcs/scripts/vault_setup.sh || { \
		echo "$(RED)❌ Vault setup failed$(NC)"; \
		exit 1; \
	}

	@echo "$(GREEN)✅ Vault initialization completed successfully!$(NC)"




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
	@echo "✨ Build Complete!"

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
	@echo "🧹 Starting cleanup process..."

	@echo "🗑️  Removing migrations..."
	@docker exec tr_django remove_migrations.sh 2>/dev/null || echo "$(YELLOW)⚠️  Django container not running$(NC)"
	@docker exec tr_channels remove_migrations.sh 2>/dev/null || echo "$(YELLOW)⚠️  Channels container not running$(NC)"

	@echo "🚀 Cleaning project Docker resources in parallel..."
	@{ \
		echo "🛑 Stopping containers..." && \
		docker compose -f ./srcs/docker-compose.yml -f ./srcs/devops-docker-compose.yml down --volumes --remove-orphans & \
		echo "🗑️  Removing project containers..." && \
		docker ps -a --format '{{.Names}}' | grep '^tr_' | xargs -r docker rm -f & \
		echo "🗑️  Removing project images..." && \
		for img in $(PROJECT_IMAGES); do docker rmi -f $$img 2>/dev/null & done && \
		echo "🗑️  Removing project volumes..." && \
		docker volume ls --format '{{.Name}}' | grep '^tr_' | xargs -r docker volume rm -f & \
		echo "🌐 Removing project networks..." && \
		docker network rm $(NETWORK_NAME) $(NETWORK_DEVOPS_NAME) & \
		wait; \
	} 2>/dev/null || true

	@echo "🗑️  Removing data directories..."
	@for dir in postgres_data elasticsearch_data apm_server_data fleet_server_data; do \
		if [ -d "./srcs/data/$$dir" ]; then \
			sudo rm -rf "./srcs/data/$$dir" & \
		fi \
	done
	@wait

	@echo "$(GREEN)✅ Project cleanup completed successfully!$(NC)"

clean-data:
	@echo "🧹 Starting data cleanup process..."
	@echo "📝 Preserving directories:"
	@echo "   • django_data"
	@echo "   • media_data"
	@echo "   • website_data"
	@echo "   • channels_data"

	@# Vérification du répertoire srcs/data
	@if [ ! -d "srcs/data" ]; then \
		echo "$(YELLOW)⚠️  Data directory not found, nothing to clean$(NC)"; \
		exit 0; \
	fi

	@echo "🗑️  Removing unnecessary data..."
	@sudo find srcs/data -mindepth 1 -maxdepth 1 \
		! -name 'django_data' \
		! -name 'media_data' \
		! -name 'website_data' \
		! -name 'channels_data' \
		-exec rm -rf {} + || { \
		echo "$(RED)❌ Failed to clean data directory$(NC)"; \
		exit 1; \
	}

	@echo "$(GREEN)✅ Data cleanup completed successfully!$(NC)"

docker-clean-all:
	@echo "🚀 Starting-fast Docker cleanup..."
	@{ \
		docker kill $$(docker ps -q) & \
		docker rm -f $$(docker ps -a -q) & \
		docker rmi -f $$(docker images -q) & \
		docker volume rm -f $$(docker volume ls -q) & \
		docker network rm $$(docker network ls -q) & \
		wait; \
	} 2>/dev/null || true
	@docker system prune -af --volumes > /dev/null 2>&1 || true
	@echo "$(GREEN)✅ Fast cleanup finished!$(NC)"

re: fclean all

.PHONY: all build-and-up ssl-cert ssl-renew fclean re show-vault-token


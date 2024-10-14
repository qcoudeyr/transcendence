SHELL := /bin/bash

all: create-data-dirs build-and-up

detect-and-install-docker:
	@echo "Checking for Docker..."
	@if ! command -v docker &> /dev/null; then \
		echo "Docker not found. Installing Docker..."; \
		sudo apt update; \
		sudo apt install -y ca-certificates curl gnupg lsb-release; \
		curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg; \
		echo "deb [arch=$$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null; \
		sudo apt update; \
		sudo apt install -y docker-ce docker-ce-cli containerd.io; \
	else \
		echo "Docker is already installed."; \
	fi

	@echo "Checking for Docker Compose V2..."
	@if ! docker compose version &> /dev/null; then \
		echo "Docker Compose V2 not found. Installing Docker Compose V2..."; \
		sudo apt install -y docker-compose-plugin; \
	else \
		echo "Docker Compose V2 is already installed."; \
	fi

	@echo "Ensuring Docker Compose V2 is symlinked..."
	@if [ ! -L /usr/local/bin/docker-compose ]; then \
		echo "Creating symlink for Docker Compose V2..."; \
		sudo ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose; \
	else \
		echo "Symlink for Docker Compose V2 already exists."; \
	fi

create-data-dirs:
	@echo "Creating data directories if they do not exist..."

	@mkdir -p ./srcs/data/django_data ./srcs/data/es_data ./srcs/data/portainer_data ./srcs/data/postgres_data ./srcs/data/vault_data ./srcs/data/website_data ./srcs/data/redis_data

	@echo "Data directories created."

reset_db:
	@echo "Removing migrations..."
	docker exec django remove_migrations.sh || true
	docker exec channels remove_migrations.sh || true
	@echo "Stopping db related services..."
	docker stop channels django
	docker stop postgresql
	docker rm postgresql
	@echo "Removing database..."
	sudo rm -rf srcs/data/postgres_data
	@echo "Starting db related services..."
	make

build-and-up:
	@cd ./srcs && docker compose up -d
	sleep 2 && docker exec nginx_modsecurity_crs rm /etc/nginx/conf.d/modsecurity.conf && docker exec nginx_modsecurity_crs nginx -s reload || true

fclean:
	@echo "Removing migrations..."
	docker exec django remove_migrations.sh || true
	docker exec channels remove_migrations.sh || true
	@echo "Stopping and removing all Docker containers..."
	@cd ./srcs && docker-compose down || true
	docker stop $$(docker ps -q) || true
	docker rm $$(docker ps -a -q) || true
	@echo "Removing all Docker images..."
	docker rmi $$(docker images -q) || true
	@echo "Removing all Docker volumes..."
	docker volume rm $$(docker volume ls -q) || true
	@echo "Removing all Docker networks..."
	docker network rm $$(docker network ls -q) || true
	@echo "Removing database..."
	sudo rm -rf srcs/data/postgres_data
	@echo "Cleanup complete."

stop:
	@echo "Stopping Docker daemon and all containers..."
	@sudo systemctl stop docker* > /dev/null 2>&1
	@echo "All Docker containers stopped!"

start:
	@echo "Starting Docker daemon..."
	@sudo systemctl start docker.service docker.socket > /dev/null 2>&1
	@echo "Docker daemon started!"

restart:
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
	@$(MAKE) restart container=$@

re: fclean all

.PHONY: all build-and-up fclean re restart stop start

SHELL := /bin/bash

all: detect-and-install-docker build-and-up

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

build-and-up:
	@cd ./srcs && sudo docker compose up -d

fclean:
	@cd ./srcs && sudo docker-compose down && cd ../
	@echo "Stopping and removing all Docker containers..."
	docker stop $$(docker ps -q) || true
	docker rm $$(docker ps -a -q) || true
	@echo "Removing all Docker images..."
	docker rmi $$(docker images -q) || true
	@echo "Removing all Docker volumes..."
	docker volume rm $$(docker volume ls -q) || true
	@echo "Removing all Docker networks..."
	docker network rm $$(docker network ls -q) || true
	@echo "Cleanup complete."

restart:
	@echo "Restarting all Docker containers..."
	docker ps -q | xargs -r docker restart
	@echo "All Docker containers have been restarted."

re: fclean all

.PHONY: all build-and-up fclean re restart

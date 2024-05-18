SHELL := /bin/bash

all: build-and-up

build-and-up:
	@cd ./srcs && docker-compose up --build -d

fclean:
	@cd ./srcs && sudo docker-compose down && cd ../
	@sudo docker system prune -af
	@echo "Checking for volumes..."
	@if sudo docker volume ls | grep -q "srcs"; then \
		echo "Removing volumes..."; \
		sudo docker volume rm srcs_*; \
	else \
		echo "No volumes found."; \
	fi
	@echo "Docker cleaning is done !";
	@if [ -d "$(HOME)/data" ]; then \
		echo "Cleaning data folder..."; \
		sudo rm -rf $(HOME)/data ;\
	fi
	@echo "Cleaning is done !";

re: fclean all

.PHONY: all install-docker check-directories build-and-up generate-ssh-keys fclean re

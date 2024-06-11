SHELL := /bin/bash

all: build-and-up

build-and-up:
	@cd ./srcs && docker-compose up --build -d

fclean:
	@cd ./srcs && sudo docker-compose down && cd ../
	@sudo docker stop $(docker ps -aq) || true
	@sudo docker rm $(docker ps -aq) || true
	@sudo docker volume rm $(docker volume ls -q) || true
	@echo "Checking for volumes..."
	@echo "Cleaning is done !"

re: fclean all

.PHONY: all build-and-up fclean re

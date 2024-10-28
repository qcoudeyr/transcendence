#!/bin/bash

# python manage.py migrate

sleep 6

cd /app/transcendence && python manage.py runworker game-server -v 3
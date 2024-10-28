#!/bin/bash

# python manage.py migrate

cd /app/transcendence && python manage.py runworker game-server -v 3
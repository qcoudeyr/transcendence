#!/bin/bash

python manage.py makemigrations
python manage.py migrate

python manage.py createsuperuser --noinput --username "$DJANGO_SUPERUSER_NAME" --email "$DJANGO_SUPERUSER_EMAIL"

uvicorn transcendence.asgi:application --log-level debug --host 0.0.0.0 --port 8000 --reload
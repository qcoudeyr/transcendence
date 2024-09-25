#!/bin/bash

apps=(
    users
    profiles
)
for i in "${apps[@]}"; do
    rm -rf "$i"/migrations
done
for i in "${apps[@]}"; do
    python manage.py makemigrations "$i"
done

python manage.py migrate

python manage.py createsuperuser --noinput --username "$DJANGO_SUPERUSER_NAME" --email "$DJANGO_SUPERUSER_EMAIL"

uvicorn transcendence.asgi:application --log-level debug --host 0.0.0.0 --port 8000 --reload
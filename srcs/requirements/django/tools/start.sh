#!/bin/bash

sleep 5

remove_migrations.sh

# IFS=', ' read -r -a apps <<< "$APPS"
# for i in "${apps[@]}"; do
#     python manage.py makemigrations "$i"
# done

python manage.py makemigrations $APPS
python manage.py migrate

python manage.py createsuperuser --noinput --username "$DJANGO_SUPERUSER_NAME" --email "$DJANGO_SUPERUSER_EMAIL"

uvicorn transcendence.asgi:application \
    --host 0.0.0.0 \
    --port 8000 \
    --ssl-keyfile /app/certs/django.key \
    --ssl-certfile /app/certs/django.crt \
    --ssl-ca-certs /app/certs/ca.crt \
    --reload


#!/bin/bash

sleep 5

remove_migrations.sh

IFS=', ' read -r -a apps <<< "$APPS"
for i in "${apps[@]}"; do
    python manage.py makemigrations "$i"
done

python manage.py makemigrations
python manage.py migrate

#daphne -e ssl:8002:privateKey=/app/certs/channels.key:certKey=/app/certs/channels.crt transcendence.asgi:application
python manage.py runserver 0.0.0.0:8002

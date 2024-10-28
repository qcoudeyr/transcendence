#!/bin/bash

sleep 5

IFS=', ' read -r -a apps <<< "$APPS"
for i in "${apps[@]}"; do
    python manage.py makemigrations "$i"
done

# python manage.py migrate

python manage.py runserver 0.0.0.0:8002
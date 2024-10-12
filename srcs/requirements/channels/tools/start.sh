#!/bin/bash

remove_migrations.sh

IFS=', ' read -r -a apps <<< "$APPS"
for i in "${apps[@]}"; do
    python manage.py makemigrations "$i"
done

python manage.py makemigrations
python manage.py migrate

python manage.py runserver 0.0.0.0:8002
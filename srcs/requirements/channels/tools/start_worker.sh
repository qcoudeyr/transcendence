#!/bin/bash

# python manage.py migrate

sleep 6

/vault/entrypoint/entrypoint.sh python manage.py runworker game-server -v 3
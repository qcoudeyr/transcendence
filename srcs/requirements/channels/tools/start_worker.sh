#!/bin/bash

# python manage.py migrate

sleep 6

python manage.py runworker game-server -v 3
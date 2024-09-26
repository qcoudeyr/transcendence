#!/bin/bash

IFS=', ' read -r -a apps <<< "$APPS"
for i in "${apps[@]}"; do
    rm -rf ./"$i"/migrations
done

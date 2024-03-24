#!/bin/bash

cd test

for file in *; do
    if [ -f "$file" ] && [ -x "$file" ]; then
        npx jest "$file"
    fi
done

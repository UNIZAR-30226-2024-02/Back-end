#!/bin/bash

cd Test

for file in *; do
    if [ -f "$file" ] && [ -x "$file" ]; then
        npx jest "$file"
    fi
done

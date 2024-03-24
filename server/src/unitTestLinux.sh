#!/bin/bash

cd test

exit_code=0

for file in *; do
    if [ -f "$file" ] && [ -x "$file" ]; then
        npx jest "$file"
        
        code=$?

        if [ $code -ne 0 ]; then
            exit_code=1
        fi
    fi
done

exit $exit_code

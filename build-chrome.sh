#!/usr/bin/env bash

echo "Collecting files for chrome build. You must use chrome GUI itself to package."

# Copy the files
rm -r build
mkdir build

cp -r data build/
cp -r lib build/
cp -r src build/
# Remove firefox only files
find build/ -type f -name '*firefox.js' | xargs rm
cp manifest.json build/
cp README.md build/
cp LICENSE.txt build/

echo "Done collecting files. Please use the build directory."

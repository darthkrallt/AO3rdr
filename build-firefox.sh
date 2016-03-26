#!/usr/bin/env bash

# Make sure JPM is installed
type jpm >/dev/null 2>&1 || { echo >&2 "Need Firefox dev tool 'jpm'.  Aborting."; exit 1; }

# Copy the files
rm -r build
mkdir build

cp -r data build/
cp -r lib build/
cp -r src build/
# Remove chrome only files
find build/ -type f -name '*chrome.js' | xargs rm
cp package.json build/
cp LICENSE.txt build/
cp README.md build/
cp ff_main.js build/

# Build the firefox add on
cd build; jpm xpi; cp *.xpi ../


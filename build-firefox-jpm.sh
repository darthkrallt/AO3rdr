#!/usr/bin/env bash

# Copy the files
rm -r build
mkdir build

cp -r data build/
cp -r lib build/
cp -r src build/

# Remove files we don't want in the build
rm build/background.js  # WebExtensions main script

cp package.json build/package.json
cp LICENSE.txt build/
cp README.md build/

# Build the firefox add on
cd build; jpm xpi; cp ao3rdr.xpi ../ao3rdr-jpm.xpi

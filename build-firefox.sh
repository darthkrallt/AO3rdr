#!/usr/bin/env bash

# Copy the files
rm -r build
mkdir build

cp -r data build/
cp -r lib build/
cp -r src build/

cp manifest.json-firefox build/manifest.json
cp LICENSE.txt build/
cp README.md build/

# Build the firefox add on
cd build; zip -r ../ao3rdr.xpi *

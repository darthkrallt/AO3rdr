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

# Remove files we don't want in the build
rm build/src/toolbar-jpm-firefox.js
rm build/data/settings/articles-table-jpm-firefox.js

# Build the firefox add on
cd build; zip -r ../ao3rdr.xpi *

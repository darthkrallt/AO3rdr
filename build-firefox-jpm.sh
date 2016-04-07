#!/usr/bin/env bash

# Copy the files
rm -r build
mkdir build

cp -r data build/
cp -r lib build/
cp -r src build/

cp package.json build/package.json
cp LICENSE.txt build/
cp README.md build/

# Remove files we don't want in the build
rm build/background-chrome.js  # WebExtensions main script

# Build the background script
cp index-jpm-firefox.js-raw build/index-jpm-firefox.js
cat src/background.js >> build/index-jpm-firefox.js

# Build the firefox add on
cd build; jpm xpi; cp ao3rdr.xpi ../ao3rdr-jpm.xpi

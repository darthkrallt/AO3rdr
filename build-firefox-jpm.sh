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

# Icon in the root of the directory
cp data/images/icon.png build/

# Remove files we don't want in the build
rm build/src/background-chrome.js  # WebExtensions main script
rm build/src/toolbar-chrome.js
rm build/data/settings/articles-table-chrome.js
rm build/data/settings/index-chrome.html

# Build the background script
cp index-jpm-firefox.js-raw build/index-jpm-firefox.js
cat src/background.js >> build/index-jpm-firefox.js
cat src/article.js >> build/index-jpm-firefox.js

# Build the firefox add on
cd build; jpm xpi; cp *.xpi ../ao3rdr-jpm.xpi

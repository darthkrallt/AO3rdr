#!/usr/bin/env bash

# Copy the files
rm -r build
mkdir build
mkdir build/ao3rdr

cp -r data build/ao3rdr/
cp -r lib build/ao3rdr/
cp -r src build/ao3rdr/
cp manifest.json-chrome build/ao3rdr/manifest.json
cp README.md build/ao3rdr/
cp LICENSE.txt build/ao3rdr/


./crxmake.sh ./build/ao3rdr ~/.ssh/AO3rdr.pem

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

# File modification
# index.html
index_file='build/data/settings/index.html'
insert_file='build/data/settings/index-chrome.html'

sed "s/<\!-- WebExtensions insert -->/$(sed -e 's/[\&/]/\\&/g' -e 's/$/\\n/' $insert_file | tr -d '\n')/" $index_file > $index_file'-out'
mv $index_file'-out' $index_file
# finished with index.html

# Build the firefox add on
cd build; zip -r ../ao3rdr.xpi *

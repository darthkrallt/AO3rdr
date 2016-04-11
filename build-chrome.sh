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

# Remove files we don't want in the build
rm build/ao3rdr/src/toolbar-jpm-firefox.js
rm build/ao3rdr/data/settings/articles-table-jpm-firefox.js

# File modification
# index.html
index_file='build/ao3rdr/data/settings/index.html'
insert_file='build/ao3rdr/data/settings/index-chrome.html'

sed "s/<\!-- WebExtensions insert -->/$(sed -e 's/[\&/]/\\&/g' -e 's/$/\\n/' $insert_file | tr -d '\n')/" $index_file > $index_file'-out'
mv $index_file'-out' $index_file
# finished with index.html

./crxmake.sh ./build/ao3rdr ~/.ssh/AO3rdr.pem

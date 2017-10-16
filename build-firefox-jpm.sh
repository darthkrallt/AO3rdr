#!/usr/bin/env bash

# For hybrid
# First run the webextensions build
./build-firefox.sh
# Then move the built product into a webextension folder
rm -r build
mkdir build
mkdir build/webextension
unzip ao3rdr.xpi -d build/webextension


# Now we make the "lame duck" version of the addon, that is simply memory moving

# For hybrid
cp LICENSE.txt build/
cp README.md build/
cp data/images/icon.png build/

cat lame_duck/background-firefox-hybrid.js >> build/webextension/background.js
cp lame_duck/package.json build/package.json
cp lame_duck/index.js build/
cp lame_duck/manifest.json build/webextension/manifest.json

# Build the firefox add on
cd build; ~/AO3rdr/node_modules/jpm/bin/jpm xpi; cp *.xpi ../ao3rdr-jpm-hybrid.xpi

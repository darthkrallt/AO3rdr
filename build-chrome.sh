#!/usr/bin/env bash
opera_flag=''
while getopts 'o' flag; do
  case "${flag}" in
    o) opera_flag='true' ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

MANIFEST_FILE='manifest.json-chrome'
if [ $opera_flag ];then
  MANIFEST_FILE='manifest.json-opera'
fi


# Copy the files
rm -r build
mkdir build
mkdir build/ao3rdr

cp -r data build/ao3rdr/
cp -r lib build/ao3rdr/
cp -r src build/ao3rdr/

cp $MANIFEST_FILE build/ao3rdr/manifest.json
cp README.md build/ao3rdr/
cp LICENSE.txt build/ao3rdr/

# File modification
# index.html
index_file='build/ao3rdr/data/settings/index.html'
insert_file='build/ao3rdr/data/settings/index-chrome.html'

sed "s/<\!-- WebExtensions insert -->/$(sed -e 's/[\&/]/\\&/g' -e 's/$/\\n/' $insert_file | tr -d '\n')/" $index_file > $index_file'-out'
mv $index_file'-out' $index_file
# finished with index.html

./crxmake.sh ./build/ao3rdr ~/.ssh/AO3rdr.pem

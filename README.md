DK's Unofficial Reader Manager - AO3rdr
============================

A bookmark manager for reading on Archive of Our Own (http://archiveofourown.org). Please note that this is just made by me for fun, I am not affiliated with the Archive.

Features include:
  - Three star rating system
  - Hide works
  - Blacklist by tags
  - Bookmark by chapter read
  - Scan bookmarks for updates
  - Keep track of last visit
  - Backup and restore user data
  - Cloud Sync for multiple browsers
  - Open source code!

Where to get it
---------------

### Chrome

Available from the Google Chrome webstore https://chrome.google.com/webstore/detail/ao3rdr/hbbcholilmaipbhjbcohpleofolpdnjl

### Firefox

Latest testing version is available from https://github.com/darthkrallt/AO3rdr/blob/master/ao3rdr.xpi

Available from the Mozilla Addon site:
  * Desktop https://addons.mozilla.org/En-us/firefox/addon/ao3rdr/
  * Adroid https://addons.mozilla.org/en-us/android/addon/ao3rdr/

This is to be developed with both mobile and desktop use in mind, so no SDK's 
were used that are not available on Firefox's beta mobile browser.

Credits
-------
- Skeleton: getskeleton.com
    Easy CSS and layout bones for settings page
- The Noun Project: thenounproject.com
    Icons (see the README in the data folder for more comprehensive list)
- Tablesorter: tablesorter.com
    Sortable table
- XOXCO's Tag Input plugin: xoxco.com/projects/code/tagsinput/
    Fancy tag input
- Spin.js: http://fgnass.github.io/spin.js/
    Spinner grapic thing. @__@

FF Docs to consider
https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Mobile_development

BUGS
<<<<<<< HEAD:README.md
----
  - Please report any others you find!
=======
  - Firefox memory is unstable. Please regularly back up.
>>>>>>> Removed crawl for updates feature. Fixed bug in sync logic.:README.txt

TODO
  - Check works for update on server

WISHLIST (not for this release)
-------------------------------
  - Add "added on" date (not visible in UI)
  - Add some cool stats to the settings page (eg, read the equivalent of 3 LOTR
      series in the last 90 days)
  - Add tabbed view to settings page to sort by genre
  - Add SAD star rating
  - bookmark by individual line (when works are 50,000+ words in one chapter)
    - Maybe use some fancy hashin' 
        https://github.com/Caligatio/jsSHA/releases/tag/v1.5.0
    - also take advantage of the (#id_ref) url strings for this
  - tests, HAHAHAHA. THESE ARE IMPORTANT. BUT ALSO AREN'T GONNA HAPPEN.
  - Add support for tumblr (I shudder to think how much work...)
  - Localization
  - Delete works from database via settings page
  - enable private browsing
    The DB not saving is there, but the UI responsiveness is not
  - Multi article works- eg, authors that don't use the standard chapters, but
      instead have one "chapter" per work
  - Check author for update

LICENSE
-------
    Copyright (C) 2015  Darthkrallt

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Lesser General Public
    License as published by the Free Software Foundation; either
    version 2.1 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public
    License along with this library; if not, write to the Free Software
    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
    USA

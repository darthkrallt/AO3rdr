DK's Reader Manager - AO3rdr

This is to be developed with both mobile and desktop use in mind. A secondary objective of easy porting to Chromium.

Credits
- Skeleton: getskeleton.com
    Easy CSS and layout bones for settings page
- The Noun Project: thenounproject.com
    Icons
- Tablesorter: tablesorter.com
    Sortable table
- XOXCO's Tag Input plugin: xoxco.com/projects/code/tagsinput/
    Fancy tag input
- Spin.js: http://fgnass.github.io/spin.js/
    Spinner grapic thing. @__@

FF Docs to consider
https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Mobile_development

Other Resources to consider
https://github.com/Caligatio/jsSHA/releases/tag/v1.5.0

BUGS
- fix "last visit" (it's undefined when you bookmark from tags page)
    - undefined after the 4th+ crawled aticles POST crawl
    - but it is hitting the "inside emitter crawler"
    - visit is getting set in those entries on crawl

TODO
- does the update flag still work
- export/import data
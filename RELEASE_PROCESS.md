# Release Countdown Checklist!

Alright, you've fixed some bugs, added some features, and are ready to release into the wild! What are the things you need to remember?

We are supporting _three_ platforms, so let's have a rundown for each.

### Prepare for release:

- [ ] Ensure new version number (eg, 1.X.0)
    Update in:
    - [ ] manifest.json-chrome
    - [ ] manifest.json-firefox (this not yet a release version)
    - [ ] package.json
- [ ] Check for dependencies to AO3rdr-backend. Deploy if necessary.

### Automated Tests:

- [ ] Check test results of AO3rdr/test/tests.html on:
    - [ ] Chrome
    - [ ] Firefox
    - [ ] Opera

### Manual QA tests:
Run on EACH BROWSER.

- [ ] Add bookmarks via:
    - [ ] Works page
    - [ ] Bookmarks page
    - [ ] Article page
- [ ] Delete bookmark from extension page
- [ ] Download backup
- [ ] Upload Backup
- [ ] Run sync
- [ ] Check blacklisting works
- [ ] Toggle blackilsting on/off


### Build:

- [ ] ./build-chrome.sh  # you will use the unpacked generated folder build/ao3rdr for both Chrome and Opera
- [ ] ./build-firefox-jpm.sh  # Firefox version

### Uploading A new version:

- [ ] Firefox: https://addons.mozilla.org/en-US/firefox
    Expected wait time: Days to weeks depending on queue length.
    Be sure to keep an eye on email in case of rejection
- [ ] Chrome: https://chrome.google.com/webstore/developer/dashboard
    Expected wait time: < 1 hour
- [ ] Opera: https://addons.opera.com/developer/
    Expected wait time is ???

### What to do if rejected?

- [ ] Address the bug. No ifs ands or buts. Their word is final. Only ask for clarification if you don't understand what they mean.
- [ ] INCREMENT MINOR VERSION NUMBER (eg, 1.2.X). Failing to do so is an auto-reject.
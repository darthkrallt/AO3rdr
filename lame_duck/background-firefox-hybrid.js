// This gets "cat"-ed onto webextension/background.js during build

// Ask to the legacy part to dump the needed data and send it back
// to the background page...
var port = browser.runtime.connect({name: "sync-legacy-addon-data"});
port.onMessage.addListener((msg) => {
  if (msg) {
    // Where it can be saved using the WebExtensions storage API.
    console.log(msg);
    restoreFromBackup(msg);
    console.log(browser.storage.local.get('ficdict'));
  }
});

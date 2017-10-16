const webext = require("sdk/webextension");
const ss = require("sdk/simple-storage");

console.log("inside hybrid launcher");

setSyncLegacyDataPort = function(port) {
  // Send the initial data dump.
  port.postMessage({
    message: 'ff-legacy-storage-sync',
    data : {
      version: 'ff-legacy',
      prefs: ss.storage.prefs,
      ficdict: ss.storage.ficdict
    }
  });
};


webext.startup().then(({browser}) => {
  browser.runtime.onConnect.addListener(port => {
    if (port.name === "sync-legacy-addon-data") {
        console.log("start sync");
        setSyncLegacyDataPort(port);
        console.log("synched");
    }
  });
});


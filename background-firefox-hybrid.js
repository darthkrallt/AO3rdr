const webext = require("sdk/webextension");
const {setSyncLegacyDataPort} = require("./src/storage-firefox-hybrid");

console.log("inside hybrid launcher");

webext.startup().then(({browser}) => {
  browser.runtime.onConnect.addListener(port => {
    if (port.name === "sync-legacy-addon-data") {
        console.log("start sync");
        setSyncLegacyDataPort(port);
        console.log("synched");
    }
  });
});

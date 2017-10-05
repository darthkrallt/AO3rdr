const ss = require("sdk/simple-storage");

exports.setSyncLegacyDataPort = function(port) {
  // Send the initial data dump.
  port.postMessage({
    prefs: ss.storage.prefs,
    ficdict: ss.storage.ficdict
  });
};

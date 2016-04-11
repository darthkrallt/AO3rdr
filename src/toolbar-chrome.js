function emitSettingsClick(){
    chrome.runtime.sendMessage({message: 'settingsclick'});
}

var toolPort = chrome.runtime.connect({name: "toolbar"});

toolPort.onMessage.addListener(function(request, sender, sendResponse) {
    toolbar_listener(request);
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    toolbar_listener(request)
});

/* The background process for chrome */
var storage = chrome.storage.local;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == 'settingsclick'){
        // open new tab
        chrome.tabs.create(
            {url: chrome.extension.getURL('data/settings/index.html')}
        );
    }
});

function broadcast(message){
    "Broadcast a message to ALL tabs. No callbacks allowed. Tested this with "
    "enough tabs open to make my computer sluggish. Didn't seem to make it worse,"
    "I assume this is a really light weight function."

    // Don't put the extensionId as the first argument.
    // All you will get is WAT.
    chrome.runtime.sendMessage(message);

    // You need the tabs permission to match on url
    chrome.tabs.query({url: '*://*.archiveofourown.org/*'}, function(tabs) {
        // This DOES have the matching tabs
        for (var idx in tabs) {
            if (tabs[idx].id){
                chrome.tabs.sendMessage(tabs[idx].id, message);
            }
        }
    });
}

// NOTE! You have to call this twice to get it to send
// first with the port, then with the data you want to send.
var callbackMessage = (function(port){
    return function(message, data, data_type) {
        port.postMessage({'message': message, 'data': data, 'data_type': data_type});
    };
});

chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(request) {
        if (request.message == "reveal-token"){
            getUser(callbackMessage(port));
        }

        if (request.message == 'save-token'){
            validateAndSaveToken(request.data, port);
        }

        if (request.message == 'prefs') {
            savePrefs(request.data);
        }

        if (request.message == 'fetchdata') {
            fetchDataRequest(request, port);
        }

        if (request.message == 'restorefrombackup'){
            restoreFromBackup(request);
        }

        if (request.message == 'ficdata'){
            handleNewFic(request.data.metadata, request.data.mutable_data, port);
        }

        if (request.message == 'runsync'){
            runSync();
        }
    });
});


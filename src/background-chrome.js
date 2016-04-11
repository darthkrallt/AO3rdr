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
    /*
        Broadcast a message to ALL tabs. No callbacks allowed. Tested this with
        enough tabs open to make my computer sluggish. Didn't seem to make it worse,
        I assume this is a really light weight function.
    */

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


/* Backend sync */

function newUser(){

    var xhr = new XMLHttpRequest();
    xhr.open("POST", backendUrl + "user", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 201){
                var resp = JSON.parse(xhr.responseText);
                var user_id = resp['user_id'];
                savePrefs({'user_id': user_id});
            }
        }
    }
    xhr.send();

}

function validateAndSaveToken(token, port){

    var xhr = new XMLHttpRequest();
    xhr.open("GET", backendUrl + "user/" + token, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200){
                var resp = JSON.parse(xhr.responseText);
                if ('user_id' in resp){
                    var user_id = resp['user_id'];
                    savePrefs({'user_id': user_id });
                    port.postMessage({
                        message: 'token-saved', 
                        data: {'token_status': 'valid', user_id: user_id}
                    });
                    // Pass in new token to be sure against race conditions
                    syncData(resp['user_id'], port);
                }
            } else {
                port.postMessage({
                    message: 'token-saved', 
                    data: {'token_status': 'invalid'}
                });
            }
        }
    }
    xhr.send();

}


function syncWork(data){
    if (!data.ao3id){
        return;
    }

    var callbk = (function(data){
        return function(user_id) {

            var xhr = new XMLHttpRequest();
            var url = backendUrl + 'user/' + user_id + "/work/" + data['ao3id'];
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.onreadystatechange = function() {
                if ((xhr.readyState == 4) && (xhr.status == 200 || xhr.status == 201)) {
                    var diff = JSON.parse(xhr.responseText)['diff'];

                    // This will only contain the diff of one work.
                    // If there was no difference, it will be empty.
                    if ('user_id' in diff)
                        delete diff['user_id'];
                    if (Object.keys(diff).length === 0){
                        diff['ao3id'] = data['ao3id'];
                        saveArticle(diff, true, null, false);
                    }
                }
            }
            xhr.send(data);

        };
    })(JSON.stringify(data));

    getUserForSync(callbk);

}


function syncData(user_id_override, port){
    /* Use the user_id_override when saving a new user_id/"token" and storage hasn't caught up. */
    // Grab all data
    var callbk = function(user_id, data){
        if (user_id_override)
            user_id = user_id_override;
        var xhr = new XMLHttpRequest();
        var url = backendUrl + 'user/' + user_id + "/collection";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function() {
            if ((xhr.readyState == 4) && (xhr.status == 200 || xhr.status == 201)) {
                var diff = JSON.parse(xhr.responseText)['diff'];

                // Iterate through the dictionary of changed articles and update our DB
                // the key is the work ID
                // Also contains the settings!
                for (var key in diff) {
                    if (diff.hasOwnProperty(key)) {
                        if (key == 'settings'){
                            // TODO: update the settings
                        } else if (key == 'user_id'){
                            ; // You can safely ignore
                        } else {
                            var article = diff[key];
                            if ('user_id' in article){
                                delete article['user_id'];
                            }
                            if (!(Object.keys(article).length === 0)){
                                article['ao3id'] = key;
                                saveArticle(article, true, port, false)
                            }
                        }
                    }
                }
                savePrefs({'last_sync': new Date().getTime() / 1000});

            }
        }
        xhr.send(JSON.stringify(data));
    }

    getDataForSync(callbk);
}

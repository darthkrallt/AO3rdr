/* The background process for chrome */

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    // if (request.greeting == "hello")
    //   sendResponse({farewell: "goodbye"});
    if (request.message == 'settingsclick'){
        // open new tab
        // chrome.tabs.create(object createProperties, function callback);
        chrome.tabs.create(
            {url: chrome.extension.getURL('data/settings/index.html')}
        );
    }
    if (request.message == 'ficdata'){
        newArticle = handleNewFic(request.data.metadata, request.data.mutable_data);
        // TODO: send out 'update' message
        return newArticle; // TODO: does this work?
    }
  }
);

// TODO: use storage.sync for the cloud sync key!!!
// use storage.local for everything else

// Initialize preferences
var default_prefs = {
    'autofilter': true, 
    'tags': [], 
    'last_sync':0, 
    'sync_enabled':true
};


var storage = chrome.storage.local;

storage.get("prefs", function (items){
    console.log(JSON.stringify(items));
    if (!items.prefs)
        chrome.storage.local.set({'prefs': default_prefs});
});


storage.get("ficdict", function (items){
    console.log(JSON.stringify(items));
    if (!items.ficdict)
        chrome.storage.local.set({'ficdict': {}});
});

function handleNewFic(metadata, mutable_data) {
/* Take in the data and rating, and store or update as necessary. Returns
   the new object.
*/
    if (!metadata['ao3id']){
        // Must have a vailid ID!
        return null;
    }
    console.log('handling');
    var newArticle = new Article(metadata, mutable_data);
    // We only want to create a new entry if the mutable data is more than just visit
    var create_if_ne = false;
    if (mutable_data){
        var mutable_keys = Object.keys(mutable_data);
        create_if_ne = !arrayCompare(mutable_keys, ['visit']);
    }
    saveArticle(newArticle, create_if_ne);

    // WARNING! This is misleading in the case of crawls
    return newArticle;
}

function saveArticle(newArticle, create_if_ne, port){
    var storage = chrome.storage.local;

    storage.get(newArticle.ao3id, function (data){
        var old_article = data[newArticle.ao3id];
        if (!old_article){
            if (!create_if_ne){
                return null;
            }
            data[newArticle.ao3id] = newArticle;
        } else {
            var updated_article = updateArticle(old_article, newArticle);
            if (updated_article){
                data[updated_article.ao3id] = updated_article;
            }
        }
        // Save the data
        chrome.storage.local.set( data );
        console.log(data);
        
        if (port)
            port.postMessage({message: 'newfic', data: data[newArticle.ao3id]});
    });
}


function savePrefs(prefs){
    var storage = chrome.storage.local;

    storage.get("prefs", function (items){
        console.log(items);
        for (var key in prefs){
            if ((key == 'tags') && typeof prefs[key] === 'string') {
                items.prefs[key] = prefs[key].split(',');
            } else {
                items.prefs[key] = prefs[key];
            }
            console.log(key);
        }
        chrome.storage.local.set( items );
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
    console.assert(port.name == "articles-table");
    port.onMessage.addListener(function(request) {
        console.log('articles table port'+JSON.stringify(request));
        if (request.message == "reveal-token"){
            console.log('reveal-token');

            getUser(callbackMessage(port));
        }
        if (request.message == 'save-token'){
            validateAndSaveToken(request.data, port);
        }
        if (request.message == 'prefs') {
            console.log(JSON.stringify(request));
            savePrefs(request.data);
        }
        if (request.message == 'fetchdata') {
            fetchDataRequest(request, port);
        }
        if (request.message == 'restorefrombackup'){
            console.log('restorefrombackup');

            // Update the DB data
            var version = request.data['version'];
            var article_data = request.data['article_data'];

            // TODO: this is bad. Should have a bulk updater do it in one pass
            for (var key in article_data){
                if (article_data.hasOwnProperty(key) && article_data[key]['ao3id']) {
                    console.log(article_data[key]);
                    saveArticle(article_data[key], true, port);
                    console.log('saving article');
                }
            }
            savePrefs(request.data['prefs']);

        }
    });
});

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "toolbar");

    port.onMessage.addListener(function(request) {

        if (request.message == 'fetchdata')
            fetchDataRequest(request, port);
        if (request.message == 'foo'){
            //
        }

    });


});

function fetchDataRequest(request, port){
    // Responds to 'fetchdata'
    console.log('FDR'+port.name+JSON.stringify(port));
    if (request.message == "fetchdata"){
        console.log(port.name+': '+JSON.stringify(request));
        var storage = chrome.storage.local;
        var pdd_fun = callbackMessage(port);
        if (request.data.prefs){
            storage.get("prefs", function (items){
                pdd_fun("datadump", items, "prefs");
            });
        }
        if (request.data.ficdict || request.data.exportdata){
            storage.get(function (data){
                var items = {"ficdict": {}};
                for (var key in data){
                    if (data.hasOwnProperty(key) && data[key]['ao3id'])
                        items.ficdict[key] = data[key];
                }
                if (request.data.ficdict)
                    pdd_fun("datadump", items, "ficdict");
                else {
                    items['prefs'] = data['prefs'];
                    items['version'] = '1.0.0';
                    pdd_fun("datadump", items, "exportdata");
                }
            });
        }
        if (request.data.images){
            console.log('requesting images');
            pdd_fun("datadump", images, "images");
        }
        if (request.data.ficdict_ids){
            storage.get(function (items){
                var data = {};
                console.log('ficdict requester listener'+ JSON.stringify(items));
                // NOTE: we stringify the nested list
                var ficdict_ids = JSON.parse(request.data.ficdict_ids);
                for (var key in ficdict_ids) {
                    var fd_id = ficdict_ids[key];
                    if (items[fd_id]) {
                        console.log(fd_id);
                        data[fd_id] = items[fd_id];
                    }
                }
                pdd_fun("datadump", data, "ficdict");
            });
        }
    }
}



function getUser(callbk){
    var storage = chrome.storage.local;

    storage.get("prefs", function (items){
        if (!('user_id' in items.prefs)){
            newUser(); // WARNING: this is async
        }
        console.log(JSON.stringify(items));
        callbk("token-revealed", items.prefs.user_id);  // May be null
    });

}

// NOTE! You have to call this twice to get it to send
// first with the port, then with the data you want to send.
var passDatadump = (function(port){
    return function(data_type, data) {
        port.postMessage({'message' :'datadump', 'data': data, 'data_type': data_type});
    };
});

var test = (function(port){
    return function(data) {
        console.log(port);
        console.log(data);
    };
});


// Stuff below this line is broken, 'cuz async foo!
var backendUrl = 'https://boiling-caverns-2782.herokuapp.com/api/v1.0/';

function syncWork(){

}

function newUser(){
    // TODO: actually talk to server
    savePrefs({'user_id': 'testuser'});
}


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


// var xhr = new XMLHttpRequest();
// xhr.open("GET", "http://api.example.com/data.json", true);
// xhr.onreadystatechange = function() {
//   if (xhr.readyState == 4) {
//     // JSON.parse does not evaluate the attacker's scripts.
//     var resp = JSON.parse(xhr.responseText);
//   }
// }
// xhr.send();
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
        chrome.tabs.create({url: chrome.extension.getURL('data/settings/index.html')});
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
    saveArticle(newArticle, mutable_data, create_if_ne);

    // WARNING! This is misleading in the case of crawls
    return newArticle;
}

function saveArticle(newArticle, create_if_ne){
    var storage = chrome.storage.local;

    storage.get("ficdict", function (items){
        console.log(JSON.stringify(items));
        var old_article = items.ficdict[newArticle.ao3id];
        if (!old_article){
            if (!create_if_ne){
                return null;
            }
            items.ficdict[newArticle.ao3id] = newArticle;
            chrome.storage.local.set( items );
        } else {
            var updated_article = updateArticle(old_article, newArticle);
            if (updated_article){
                items.ficdict[updated_article.ao3id] = updated_article;
                chrome.storage.local.set( items );
            }
        }
        
    });
}


function savePrefs(prefs){
    var storage = chrome.storage.local;

    storage.get("prefs", function (items){
        console.log(JSON.stringify(items));
        for (var key in prefs){
            items.prefs[key] = prefs[key];
            console.log(key);
        }
        chrome.storage.local.set( items );
    });
}


function saveTags(tags){
    savePrefs({'tags': tags.split(',')});
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
        console.log('articles table port');
        if (request.message == "reveal-token"){
            console.log('reveal-token');

            getUser(callbackMessage(port));
        }
    });
});

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "toolbar");

    port.onMessage.addListener(function(request) {

        if (request.message == "fetchdata"){
            var storage = chrome.storage.local;
            var pdd_fun = callbackMessage(port);
            if (request.data.prefs){
                storage.get("prefs", function (items){
                    pdd_fun("datadump", items, "prefs");
                });
            }
            if (request.data.ficdict){
                storage.get("ficdict", function (items){
                    pdd_fun("datadump", items, "ficdict");
                });
            }
            if (request.data.ficdict_ids){
                storage.get("ficdict", function (items){
                    var data = {};
                    console.log('ficdict requester listener'+ JSON.stringify(items));
                    // NOTE: we stringify the nested list
                    var ficdict_ids = JSON.parse(request.data.ficdict_ids);
                    for (var key in ficdict_ids) {
                        var fd_id = ficdict_ids[key];
                        if (items.ficdict[fd_id]) {
                            console.log(fd_id);
                            data[fd_id] = items.ficdict[fd_id];
                        }
                    }
                    pdd_fun("datadump", data, "ficdict");
                });
            }
        }
    });


});



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

function fetchTableData(){
    // Fetch all article data for the table.

    //return chrome.storage.local.get('ficdict');
}

function fetchTableDataId(seenIds){
    // Fetch article data by list of IDs

    // var out = {};
    // var ficdic = chrome.storage.local.get('ficdict');
    // for (var i in seenIds) {
    //     if (seenIds[i] in ficdict) {
    //         out[seenIds[i]] = ficdic[seenIds[i]];
    //     }
    // }
    // return out;
}


function fetchPrefs(){
    //return chrome.storage.local.get('prefs');
}


function fetchTags(){
    //return chrome.storage.local.get('prefs')['tags'];
}

function syncWork(){

}

function newUser(){
    // TODO: actually talk to server
    savePrefs({'user_id': 'testuser'});
}
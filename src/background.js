/* The common background process */

// TODO: DO WE JUST WANT PREFS TO GO IN THE SYNC STORAGE???
// Initialize preferences
var default_prefs = {
    'autofilter': true, 
    'tags': [], 
    'last_sync':0, 
    'sync_enabled':true,
    'hello_bar': {},
    'hello_bar_dismissed': 0
};


// Runs on startup of the add-on
chrome.storage.local.get("prefs", function (items){
    if (!items.prefs) {
        storage.set({'prefs': default_prefs});
    } else if (items.prefs.user_id) {
        // Make sure the user_id matches the one in sync'd storage
        chrome.storage.sync.get("user_id", function(result){
            // If there is a cloud user_id...
            // Ensure that the local copy of the "user_id" matches that of the cloud copy
            if (result.user_id && items.prefs.sync_enabled  && (result.user_id  != items.prefs.user_id)) {
                // save token to prefs if it's valid
                validateAndSaveTokenNoBroadcast(result.user_id, 'local');
            }
            // If there was never a cloud user_id set, add it now
            if (items.prefs.user_id && !result.user_id && items.prefs.sync_enabled) {
                validateAndSaveTokenNoBroadcast(items.prefs.user_id, 'sync');
            }
        });
    }
});


function validateAndSaveTokenNoBroadcast(token, dest){

    var xhr = new XMLHttpRequest();
    xhr.open("GET", backendUrl + "user/" + token, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200){
                var resp = JSON.parse(xhr.responseText);
                if ('user_id' in resp){
                    var user_id = resp['user_id'];
                    if (dest == 'local') {
                        savePrefs({'user_id': user_id });
                    }
                    else if (dest == 'sync') {
                        chrome.storage.sync.set({'user_id': user_id});
                    }
                }
            } else {
                // Skip invalid token (might be server error)
                console.log('Failed to save token '+ token +' to ' + dest + ' invalid.');
            }
        }
    }
    xhr.send();

}


// Making sure that the "sync" user id is in tune with the one in active use
chrome.storage.onChanged.addListener(function(changes, area_name){
    if (area_name == "sync"){
        if (changes.user_id.newValue){
            savePrefs({'user_id': changes.user_id.newValue});
        }
    }
});

function handleNewFic(metadata, mutable_data, port) {
/* Take in the data and rating, and store or update as necessary. Returns
   the new object.
*/
    if (!metadata['ao3id']){
        // Must have a vailid ID!
        return null;
    }
    var newArticle = new Article(metadata, mutable_data);
    // We only want to create a new entry if the mutable data is more than just visit
    var create_if_ne = false;
    if (mutable_data){
        var mutable_keys = Object.keys(mutable_data);
        create_if_ne = !arrayCompare(mutable_keys, ['visit']);
    }
    saveArticle(newArticle, create_if_ne, port, true, true);
}


function saveArticle(newArticle, create_if_ne, port, do_sync, do_broadcast){
    // WARNING: CHECK FOR VAILD ao3id
    // ASKING FOR undefined IN LOCALSTORAGE RETURNS EVERYTHING
    if (!newArticle.ao3id){
        return;
    }

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
        storage.set( data );

        // Sync to server (the function handles checking for permission)
        if (do_sync){
            syncWork(data[newArticle.ao3id]);
        }
        
        // Broadcast new article changes
        if (do_broadcast)
            broadcast({message: 'newfic', data: data[newArticle.ao3id]});
    });
}


function savePrefs(prefs){

    storage.get("prefs", function (items){
        var tags_changed = false;
        for (var key in prefs){
            if ((key == 'tags') && typeof prefs[key] === 'string') {
                tags_changed = (items.prefs[key].toString() != prefs[key].split(',').toString());
                items.prefs[key] = prefs[key].split(',');
            } else {
                items.prefs[key] = prefs[key];
            }
        }
        storage.set( items );
        // Good for: tags changing, last_sync changing
        broadcast({message: 'datadump', data: items, data_type:'prefs'});
    });
}


function fetchDataRequest(request, port){
    // Responds to 'fetchdata'
    if (request.message == "fetchdata"){

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
                    if (data.hasOwnProperty(key) && data[key]['ao3id']){
                        items.ficdict[key] = data[key];
                        // HACK: TODO: bugfix for html in title
                        if (items.ficdict[key]['title'] && items.ficdict[key]['title'].indexOf('Public Bookmark') >= 0){
                            items.ficdict[key]['title'] = '(please click to fix title)';
                        }
                        // HACK: Another html bugfix
                        if (items.ficdict[key]['title'])
                            items.ficdict[key]['title'] = fixRestrictedHTML(items.ficdict[key]['title']);
                    }
                }
                if (request.data.ficdict){
                    pdd_fun("datadump", items, "ficdict");
                }
                else {
                    items['prefs'] = data['prefs'];
                    items['version'] = '1.0.0';
                    pdd_fun("datadump", items, "exportdata");
                }
            });
        }
        if (request.data.ficdict_ids){
            storage.get(function (items){
                var data = {};
                // NOTE: we stringify the nested list
                var ficdict_ids = JSON.parse(request.data.ficdict_ids);
                
                for (var key in ficdict_ids) {
                    var fd_id = ficdict_ids[key];
                    if (items[fd_id]) {
                        data[fd_id] = items[fd_id];
                        // HACK: TODO: bugfix for html in title
                        if (data[fd_id]['title'] && data[fd_id]['title'].indexOf('Public Bookmark') >= 0)
                            data[fd_id]['title'] = '(please click to fix title)';
                    }
                }
                pdd_fun("datadump", data, "ficdict");
            });
        }
    }
}


function restoreFromBackup(request){
    // Update the DB data
    var version = request.data['version'];
    var article_data = request.data['ficdict'];
    // Old version of backup
    if (!article_data){
        article_data = request.data['article_data'];
    }

    var i = 0;
    var do_broadcast = true;
    for (var key in article_data){
        if (article_data.hasOwnProperty(key) && article_data[key]['ao3id']) {
            i += 1;
            // Don't broadcast more than 10 works
            if (i > 10)
                do_broadcast = false;
            saveArticle(article_data[key], true, null, false, do_broadcast);
        }
    }
    savePrefs(request.data['prefs']);
}


function getUser(callbk){

    storage.get("prefs", function (items){
        if (!('user_id' in items.prefs)){
            newUser(); // WARNING: this is async
        }
        callbk("token-revealed", items.prefs.user_id);  // May be null
    });

}


var backendUrl = 'https://www.ao3rdr.com/api/v1.0/';
// var backendUrl = 'http://127.0.0.1:5000/api/v1.0/'

function getUserForSync(callbk){

    storage.get("prefs", function (items){
        // No sync without user OR explicit permission
        if ('user_id' in items.prefs && items.prefs.sync_enabled){
            callbk(items.prefs.user_id);
        }
    });

}

function getDataForSync(callbk){

    storage.get(function (items){
        // No sync without user OR explicit permission
        if ('user_id' in items.prefs && items.prefs.sync_enabled){
            var article_data = {};
            for (var key in items){
                if (items.hasOwnProperty(key) && items[key]['ao3id'])
                    article_data[key] = items[key];
            }
            var data = {article_data: article_data, prefs: items.prefs};
            callbk(items.prefs.user_id, data);
        }
    });

}

function runSync(){

    storage.get('prefs', function (items){
        // No sync without user OR explicit permission
        if ('user_id' in items.prefs && items.prefs.sync_enabled){
            var minSyncWait = 60 * 60 * 10;  // 10 Minutes for full sync
            if ((Date.now()/1000) -  minSyncWait < items.prefs['last_sync']){
                return;
            }

            syncData();
            getHelloBar();  // Why not...
        }
    });

}


/* The common background process */

// Initialize preferences
var default_prefs = {
    'autofilter': true, 
    'tags': [], 
    'last_sync':0, 
    'sync_enabled':true
};


storage.get("prefs", function (items){
    if (!items.prefs)
        storage.set({'prefs': default_prefs});
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
    saveArticle(newArticle, create_if_ne, port, true);
}

function saveArticle(newArticle, create_if_ne, port, do_sync){
    // WARNING: CHECK FOR VAILD ao3id
    // ASKING FOR undefined IN LOCALSTORAGE RETURNS EVERYTHING
    console.assert(newArticle.ao3id);
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
        // Only broadcast if tags changed
        if (tags_changed){
            broadcast({message: 'datadump', data: items, data_type:'prefs'});
        }
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
            pdd_fun("datadump", images, "images");
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

    for (var key in article_data){
        if (article_data.hasOwnProperty(key) && article_data[key]['ao3id']) {
            saveArticle(article_data[key], true, port, true);
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


// Stuff below this line is broken, 'cuz async foo!
var backendUrl = 'https://boiling-caverns-2782.herokuapp.com/api/v1.0/';
// var backendUrl = 'http://127.0.0.1:5000/api/v1.0/'

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

function runSync(){

    storage.get('prefs', function (items){
        // No sync without user OR explicit permission
        if ('user_id' in items.prefs && items.prefs.sync_enabled){
            var minSyncWait = 60 * 60 * 10;  // 10 Minutes for full sync
            if ((Date.now()/1000) -  minSyncWait < items.prefs['last_sync']){
                return;
            }

            syncData();
        }
    });

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

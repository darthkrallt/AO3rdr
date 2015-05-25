

function emitSettingsClick(){
    chrome.runtime.sendMessage({message: 'settingsclick'});
}

var toolPort = chrome.runtime.connect({name: "toolbar"});

function emitFicData(metadata, mutable_data){
    var visit = new Date().toJSON();
    // You always want to include the date of visit when a toolbar action is performed
    mutable_data['visit'] = visit;
    // used to be 'click' as msg emitted
    toolPort.postMessage(
        {message: 'ficdata', data: {"metadata": metadata, "mutable_data": mutable_data}}
    );

    console.log( JSON.stringify(metadata));
}

toolPort.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == 'datadump'){
        console.log('datadump listner:'+JSON.stringify(Object.keys(request.data)));
        if (request.data_type == 'images'){
            images = request.data;
        }
        if (request.data_type == 'prefs'){
            prefs = request.data['prefs'];
            // Re-do blacklisting
            console.log('prefs');
            console.log(prefs);
            blacklistBrowsePage(prefs);
        }
        if (request.data_type == 'ficdict'){
            console.log(JSON.stringify(request));
            for (key in request.data){
                var newArticle = request.data[key];
                // check for element
                var ele = checkForWork(newArticle.ao3id);
                if (ele) {
                    // Clear any selected
                    clearImage(ele);
                    // swap out the images
                    setImage(ele, newArticle);
                    // Also check if it was blacklisted, if so we want to undo it
                    undoBlacklist(newArticle.ao3id);
                }
            }
        }
        if (request.data_type == 'images'){
            images = request.data;
        }
        // can reply with toolPort.postMessage()
    } else if (request.message == 'newfic') {
        // update images
        updateImage(request.data);
    }
});

function toolbar_onload(ids) {
    console.log(JSON.stringify(ids));
    toolPort.postMessage({message: 'runsync'});
    toolPort.postMessage({message: 'fetchdata', data: {images: true}});
    toolPort.postMessage({message:'fetchdata', data: {ficdict_ids: JSON.stringify(ids), prefs: true} });
}

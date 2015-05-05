

function emitSettingsClick(){
    chrome.runtime.sendMessage({message: 'settingsclick'});
}

function requestData (argument) {
    // body...
}

function emitFicData(metadata, mutable_data){
    var visit = new Date().toJSON();
    // You always want to include the date of visit when a toolbar action is performed
    mutable_data['visit'] = visit;
    // used to be 'click' as msg emitted
    chrome.runtime.sendMessage(
        {message: 'ficdata', data: {"metadata": metadata, "mutable_data": mutable_data}}
    );

    // WARNING: this doesn't wait for confirm save (unlike FF)
    updateImage(new Article(metadata, mutable_data));

    // TODO: implement this
    console.log( JSON.stringify(metadata));
}

var port = chrome.runtime.connect({name: "toolbar"});

// port.postMessage({message:'fetchdata'});

port.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == 'datadump'){
        console.log('datadump listner:'+JSON.stringify(Object.keys(request.data)));
        if (request.data_type == 'images'){
            images = request.data;
        }
        if (request.data_type == 'prefs'){
            prefs = request.data;
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

        // can reply with port.postMessage()
    } else if (request.message == "update"){
        var newArticle = request.data;
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
});

function toolbar_onload(ids) {
    console.log(JSON.stringify(ids));
    port.postMessage({message:'fetchdata', data: {ficdict_ids: JSON.stringify(ids)} });
}

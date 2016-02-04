

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

}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    toolbar_listener(request)
});


toolPort.onMessage.addListener(function(request, sender, sendResponse) {
    toolbar_listener(request);
});

function toolbar_listener(request){
    switch (request.message) {
        case 'newfic':
            updateImage(request.data);
            break;
        case 'ficdict':
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
            }        case 'token-saved':
            onTokenSave(request.data['token_status']);
            break;
        case 'datadump':
            toolbar_datadumper(request);
            break;
        default:
            console.log('responder missed in toolbar');
            break;
    }
}

function toolbar_datadumper(request){
    switch(request.data_type){
        case 'prefs':
            prefs = request.data['prefs'];
            // Re-do blacklisting
            blacklistBrowsePage(prefs);
            break;
        case 'images':
            images = request.data;
            break;
        case 'ficdict':
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
        default:
            console.log('datadumper missed in toolbar');
            break;
    }
}

function toolbar_onload(ids) {
    toolPort.postMessage({message: 'runsync'});
    toolPort.postMessage({message: 'fetchdata', data: {images: true}});
    toolPort.postMessage({message: 'fetchdata', data: {ficdict_ids: JSON.stringify(ids), prefs: true} });
}

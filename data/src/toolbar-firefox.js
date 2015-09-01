var toolbar_onload = (function (port){
    return function(ids) {
        port.emit('doneprocessing', ids);
    }
})(self.port);


self.on('message', function onMessage(incomming_data) {
    images = incomming_data['images'];
    prefs = incomming_data['prefs'];
    platform = incomming_data['platform'];
    // will be 'android', 'Linux', 'Darwin', or 'WINNT'

    // Run the thing!
    processPage();
});

// You have to employ this little wrapper trick to get the self.port to work
// for your message passing to the main.js
var emitFicData = (function(port){
    return function(metadata, mutable_data) {
        var visit = new Date().toJSON();
        // You always want to include the date of visit when a toolbar action is performed
        mutable_data['visit'] = visit;
        port.emit('click', {"metadata":metadata, "mutable_data":mutable_data});
    };
})(self.port);

var emitSettingsClick = (function(port){
    return function(){
        port.emit('settingsclick', 1);
    };
})(self.port);


// Listening to updates after initial load
self.port.on('update', function(newArticle){
    console.log('on update');
    console.log(JSON.stringify(newArticle));
    if (!newArticle){
        return;
    }
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
});
var emitSettingsClick = (function(port){
    return function(){
        port.emit('settingsclick', 1);
    };
})(self.port);


self.on('message', function onMessage(request) {
    toolbar_listener(request);
});


var postMessage = (function(port){
    return function(dictionary) {
        port.emit(dictionary.message, dictionary);
    };
})(self.port);

var toolPort = {postMessage: postMessage};

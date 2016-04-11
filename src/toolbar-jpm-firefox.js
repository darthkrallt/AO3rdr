var emitSettingsClick = (function(port){
    return function(){
        port.emit('settingsclick', 1);
    };
})(self.port);


self.on('message', function onMessage(request) {
    console.log('toolbar message recieved');
    console.log(request);
    toolbar_listener(request);
});

self.port.on('message', function(request) {
    console.log('toolbar port message recieved');
    console.log(request);
    toolbar_listener(request);
});


var postMessage = (function(port){
    return function(dictionary) {
        console.log('toolPort');
        console.log(dictionary);
        port.emit(dictionary.message, dictionary);
    };
})(self.port);

var toolPort = {postMessage: postMessage};

var images = self.options.images;
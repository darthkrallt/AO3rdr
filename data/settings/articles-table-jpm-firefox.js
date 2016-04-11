self.on('message', function onMessage(request) {
    articles_listener(request);
});


self.port.on('message', function(request) {
    articles_listener(request);
});

var postMessage = (function(port){
    return function(dictionary) {
        port.emit(dictionary.message, dictionary);
    };
})(self.port);

var artPort = {postMessage: postMessage};

var images = self.options.images;

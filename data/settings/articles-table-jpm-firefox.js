self.on('message', function onMessage(request) {
    console.log('articles message recieved');
    console.log(request);
    articles_listener(request);
});


self.port.on('message', function(request) {
    console.log('articles port message recieved');
    console.log(request);
    articles_listener(request);
});

var postMessage = (function(port){
    return function(dictionary) {
        port.emit(dictionary.message, dictionary);
    };
})(self.port);

var artPort = {postMessage: postMessage};

var images = self.options.images;

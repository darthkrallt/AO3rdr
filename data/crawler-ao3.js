// This is very similar to a page-worker file, but instead needs to use
// addon to access ports

var emitCrawlData = (function(port){
    return function(metadata, mutable_data) {
        console.log('inside emitter crawler');
        port.emit('crawlcomplete', {"metadata":metadata, "mutable_data":mutable_data});
    };
})(self.port);

// When viewing a page by a crawl
// NOTE: this function is named the same, but slightly different from the one 
// in the toolbar
function onPageviewUpdater(){
    if (checkIfArticlePage()) {
        var info = parseArticlePage($('#main'));
        // Doesn't have mutable data, we are only checking the immutable
        emitCrawlData(info, null);
        console.log('emitted');
    } else {
        // TODO: Multi article "works"... looong way off
        ;
    }
}

self.port.on('restartcrawl', function(){
    console.log('restartcrawl');
    onPageviewUpdater();
});

$(document).ready(function() { 
    onPageviewUpdater();
}); 
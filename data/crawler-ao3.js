// This is very similar to a page-worker file, but instead needs to use
// addon to access ports

var emitCrawlData = (function(port){
    return function(metadata, mutable_data) {
        console.log('inside emitter crawler');
        console.log(metadata);
        port.emit('crawlcomplete', {"metadata":metadata, "mutable_data":mutable_data});
    };
})(self.port);

// When viewing a page, whether by a user or a crawl, we want to
// update several fields automatically.
// NOTE: this functions gets DUPLICATED in the toolbar
// TODO: examine the necessity of the duplication
function onPageviewUpdater(){
    if (checkIfArticlePage()) {
        var info = parseArticlePage($('#main'));
        // Doesn't have mutable data, we are only checking the immutable
        // TODO: don't update "last visit" when crawling, use a different "crawled" timestamp
        emitCrawlData(info, null);
        console.log('emitted');
    } else {
        // TODO: implement updating of chapter information only for multi work
        // pages. Saves some crawl bandwidth, but a very low priority feature.
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
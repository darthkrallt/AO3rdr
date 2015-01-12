var data = require('sdk/self').data;
var self = require("sdk/self");
var simpleStorage = require('sdk/simple-storage');
var pageMod = require("sdk/page-mod");
var pageWorker = require("sdk/page-worker");
var tabs = require("sdk/tabs");

// Keeps track of all the workers that pass messages from here (main.js,
// the main addon) to the contentScripts (they do the work directly touching
// the browser.)
var workerList = [];
var crawledUrls = [];

function detachCrawler(parentWorker, url, crawlerDict){
    var index = crawlerDict.indexOf(url);
    if(index != -1) {
        crawlerDict.splice(index, 1);
        console.log('detaching');
    }
    console.log(crawlerDict);
    if (crawlerDict.length < 1){
        console.log('here');
        // list is empty, signal crawling is over
        parentWorker.port.emit('allcrawlscomplete');
    }
}

function detachWorker(worker, workerArray) {
    var index = workerArray.indexOf(worker);
    if(index != -1) {
        workerArray.splice(index, 1);
        console.log('detaching');
    }
}

// Initialize the storage if none exists
if (!simpleStorage.storage.ficdict)
    simpleStorage.storage.ficdict = {};

if (!simpleStorage.storage.prefs)
    // autofilter is enabled by default
    simpleStorage.storage.prefs = {'autofilter': true, 'tags': []};

function handleNewFic(metadata, mutable_data) {
/* Take in the data and rating, and store or update as necessary. Returns
   the new object.
*/
    console.log('handler');
    console.log(mutable_data);
    var newArticle = new Article(metadata, mutable_data);
    if (!(newArticle.ao3id in simpleStorage.storage.ficdict)) {
        // If there's no mutable data coming in or the only mutable data coming in is a 
        // page view, and no old entry, skip it.
        if (!mutable_data){
            return null;
        } else {
            //var mutable_keys = $.map(mutable_data, function(element,index) {return index});
            var mutable_keys = Object.keys(mutable_data);
            console.log(mutable_keys);
            if (mutable_keys == ['visit']){
                return null;
            }
        }
        simpleStorage.storage.ficdict[newArticle.ao3id] = newArticle;
    } else {
        // Update only
        console.log('update only');
        updateArticle(simpleStorage.storage.ficdict[newArticle.ao3id], newArticle);
    }
    console.log('stored');
    console.log(simpleStorage.storage.ficdict[newArticle.ao3id])
    return simpleStorage.storage.ficdict[newArticle.ao3id];
}

function updateArticle(old_article, new_article){
/* Update an existing article.
       WARNING! MODIFIES the old_article!
       used by function handleNewFic
*/
    old_article.visit = new_article.visit;

    if (new_article.rating){
        old_article.rating = new_article.rating;
    }

    if (new_article.chapters){
        old_article.chapters = new_article.chapters;
    }

    // Important! We need to always update these both together!
    if (new_article.read || !(old_article.read)) {
        old_article.read = new_article.read;
        old_article.chapter_id = new_article.chapter_id;
    }

    console.log('updating article');
    console.log(new_article.overrides);
}

function Article(metadata, mutable_data) {
/* Article Object. As it gets stored in memory.
*/
    this.ao3id = metadata.id;
    this.author = metadata.author;
    this.title = metadata.title;
    this.crawled = new Date().toJSON().slice(0,10);
    this.updated = new Date(metadata.updated).toJSON().slice(0,10);
    this.chapters = metadata['chapters'];

    if (mutable_data) {
        this.rating = mutable_data['rating'];
        this.read = mutable_data['chapters_read'] || 0;
        this.chapter_id = mutable_data['chapter_id'];
        this.visit = mutable_data['visit'];
    }
}

function fetchTableData(){
/* Fetch all article data for the table.
*/
    return simpleStorage.storage.ficdict;
}

function fetchTableDataId(seenIds){
/* Fetch article data by list of IDs
*/
    var out = {};
    for (var i in seenIds) {
        if (seenIds[i] in simpleStorage.storage.ficdict) {
            out[seenIds[i]] = simpleStorage.storage.ficdict[seenIds[i]];
        }
    }
    return out;
}


function fetchPrefs(){
    return simpleStorage.storage.prefs;
}

function savePrefs(prefs){
    for (var key in prefs){
        simpleStorage.storage.prefs[key] = prefs[key];
    }
    console.log(simpleStorage.storage.prefs);
}

function fetchTags(){
    return fetchPrefs['tags'];
}

function saveTags(tags){
    savePrefs({'tags': tags});
}
// Functions for listening to incomming message data

// All the scripts for running the settings page need are attached here because
// they're special snowflakes that do message passing to main.js
var settingsPage = tabs.on('ready', function(tab) {
    worker = tab.attach({
        contentScriptFile: [data.url('jquery-1.11.2.min.js'),
                            self.data.url('./jquery.tablesorter.min.js'),
                            self.data.url('./settings/jquery.tagsinput.min.js'),
                            self.data.url("./settings/articles-table.js"),
                            self.data.url('./spin.min.js'),],
        onAttach: function(worker) { 
            var outgoingData = {
                'images': toolbarImages,
                'data': fetchTableData(),
                'prefs': fetchPrefs(),
            };
            workerList.push(this);
            this.port.emit('attached', outgoingData);
            console.log('attached tab');
            // Listen for tabs settings changes and save them
            this.port.on('tags', function(tags) {
                console.log('recieved tags');
                saveTags(tags);
            });
            this.port.on('prefs', function(prefs) {
                console.log('recieved prefs');
                savePrefs(prefs);
            });
            var crawlfun = (function(parentWorker, port) {
                return function() {
                    var urls = crawlWorks(parentWorker);
                    if (urls) {
                        crawledUrls = urls;
                        console.log(crawledUrls);
                    } else {
                        // do nothing, because a crawl was not started in this thread,
                        ;
                    }
                };
            })(this, this.port);
            this.port.on('crawlrequest', function(port) {
                // pass in the parent "worker" that's generating it so we can pass
                // messages back
                crawlfun();
            });
        },
        // TODO: BUGFIX: why isn't onClose triggering?
        onClose: function() {
            // triggers on navigate away, not tab close?
            console.log('closed tab');
            detachWorker(this, workerList);
        },
    });
    // In this scope, emit like this:
    //worker.port.emit('attached', 'cake');
});

// You need to pass resources to the contentScripts. Here are all the images
// used by the toolbar.
var toolbarImages = {
    'star-0': self.data.url('./star-0.svg'),
    'star-1': self.data.url('./star-1.svg'),
    'star-3': self.data.url('./star-3.svg'),
    'star-5': self.data.url('./star-5.svg'),
    'star-1-fill': self.data.url('./star-1-fill.svg'),
    'star-3-fill': self.data.url('./star-3-fill.svg'),
    'star-5-fill': self.data.url('./star-5-fill.svg'),
    'hidden': self.data.url('./hidden.svg'),
    'dislike': self.data.url('./dislike.svg'),
    'dislike-fill': self.data.url('./dislike-fill.svg'),
    'menu': self.data.url('./menu.svg'),
    'flag': self.data.url('./flag.svg'),
    'unread': self.data.url('./unread.svg'),
    'read': self.data.url('./read.svg'),
    'bookmark': self.data.url('./bookmark.svg'),
    'bookmark-fill': self.data.url('./bookmark-fill.svg'),
};

// Create a page mod
// It will run a script whenever a ".org" URL is loaded
// The script replaces the page contents with a message

// Modify the pages of AO3 to show the addon stuff. Also attaches the workers who
// do the message passing.
var setupAO3 = pageMod.PageMod({
    // TODO: get this pattern to match more specifically to the pages we're working on
    include: "http://archiveofourown.org/*",
    // TODO: this is just for testing purposes, use a saved copy because my home internet sucks
    //include: "file:///home/nozilla3/Downloads/*",
    contentScriptWhen: 'ready',
    contentScriptFile: [data.url('jquery-1.11.2.min.js'),
                        self.data.url("./toolbar-ao3.js"),
                        self.data.url("./ao3lib.js"),],
    // We actually want this on any page load of the site
    onAttach: function(worker) {
        var outgoingData = {
            'images': toolbarImages,
            'prefs': fetchPrefs(),
        };
        worker.postMessage(outgoingData);
        workerList.push(worker);
        worker.on('detach', function () {
            detachWorker(this, workerList);
        });

        // This is duplicate code with generateCralwer
        worker.port.on('click', function(data) {
            newArticle = handleNewFic(data.metadata, data.mutable_data);;
            worker.port.emit('update', newArticle);
        });

        worker.port.on('settingsclick', function() {
            var newTab = tabs.open(self.data.url('./settings/index.html'));
        });
        worker.port.on('doneprocessing', function(seenIds) {
            // Once it's done with it's initial page modifications, we want to
            // check if we've seen the id's before, and send back any we have
            // for updating.
            var outgoingData = fetchTableDataId(seenIds);
            // TODO: replace this with a bulk method
            for (var i in outgoingData){
                worker.port.emit('update', outgoingData[i]);
            }
        });
    }
});

// The crawler
var pageWorkers = require("sdk/page-worker");

// The OLD crawler. Didn't need the signal, but was torn down after a single
// url crawl. Currently UNUSED.
// // Crawler running on a single url
// function generateCrawler(parentWorker, url) {
//     var worker = pageWorkers.Page({
//         contentURL: url,
//         contentScriptWhen: 'ready',
//         contentScriptFile: [data.url('jquery-1.11.2.min.js'),
//                             self.data.url("./crawler-ao3.js"),
//                             self.data.url("./ao3lib.js"),],
//         contentScriptWhen: "ready",
//     });
//     worker.port.on('crawlcomplete', function(data){
//         console.log('crawler main recieved signal'); 
//         newArticle = handleNewFic(data.metadata, data.mutable_data);
//         detachCrawler(parentWorker, url, crawledUrls);
//         console.log('about to destroy');
//         worker.destroy();
//         console.log('destroyed');
//     });
// }

// crawlier running on a list of urls, one at a time
// Let it be known that this is a little bit messy, you have to explicitly
// signal it with the 'restartcrawl' for it to run for the 2nd + urls.
function generateCrawler(parentWorker, urlList) {
    var worker = pageWorkers.Page({
        contentURL: urlList[0],
        contentScriptWhen: 'ready',
        contentScriptFile: [data.url('jquery-1.11.2.min.js'),
                            self.data.url("./crawler-ao3.js"),
                            self.data.url("./ao3lib.js"),],
        contentScriptWhen: "ready",
    });
    worker.port.on('crawlcomplete', function(data){
        console.log('crawler main recieved signal'); 
        newArticle = handleNewFic(data.metadata, data.mutable_data);
        detachCrawler(parentWorker, urlList[0], crawledUrls);
        if (urlList.length < 1){
            console.log('about to destroy');
            worker.destroy();
            console.log('destroyed');
            return;
        }
        worker.contentURL = urlList[0];
        worker.port.emit('restartcrawl');
        urlList.pop();
        console.log(urlList[0]);
    });
}

function divyUp(inList, batches){
    // divys up the inList into n batches
    // can't have more batches than elements
    out = [];
    batches = Math.min(inList.length, batches);
    var batchSize = Math.floor(inList.length / batches);
    var extra = inList.length % batchSize;
    var prev = 0;
    for (var i=batchSize; i <= inList.length; i+= batchSize){
        // if there are extra, add one to the batch _and_ i, decrement extra
        if (extra > 0){
            i += 1;
            extra -= 1;
        }
        out.push(inList.slice(prev, i));
        prev = i;
    }
    return out;
}


var batchSize = 3;
// TODO: user configurable batch size

function crawlWorks(parentWorker){
    var works = fetchTableData();
    // Only crawl non-complete works
    var out = [];
    // if there's already a crawl in progress, DO NOT CRAWL,
    if (crawledUrls.length > 0) {
        // send the signal that the crawl is over
        parentWorker.port.emit('allcrawlscomplete');
        return [];
    }
    for (var i in works){
        var data = works[i];
        console.log(data);
        if ((data.chapters['complete']) || (data.rating == -1)){
            continue;
        }
        var url = 'http://archiveofourown.org/works/' + data.ao3id;
        console.log(url);
        out.push(url);
    }
    if (out.length < 1) {
        // send the singal that the crawl is over, since no workers were made
        // this is the case of "nothing to crawl"
        parentWorker.port.emit('allcrawlscomplete');
    }
    var batches = divyUp(out, batchSize);
    console.log('batches');
    console.log(batches);
    for (var i in batches){
        console.log('generating batch');
        generateCrawler(parentWorker, batches[i]);
    }
    // TODO: time lockout of crawl (eg don't recrawl last 5 minutes)
    return(out);
}

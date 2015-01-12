/* ContentScript file for modifying the AO3 pages. Depends on ao3lib.

*/

self.on('message', function onMessage(incomming_data) {
    images = incomming_data['images'];
    prefs = incomming_data['prefs'];

    // Run the thing!
    processPage();
});

// You have to employ this little wrapper trick to get the self.port to work
// for your message passing to the main.js
var emitFicData = (function(port){
    return function(metadata, mutable_data) {
        console.log('inside emitterao3');
        console.log(metadata);
        port.emit('click', {"metadata":metadata, "mutable_data":mutable_data});
    };
})(self.port);

var emitSettingsClick = (function(port){
    return function(){
        console.log('settings clicked');
        port.emit('settingsclick', 1);
    };
})(self.port);


// Listening to updates after initial load
self.port.on('update', function(newArticle){
    console.log('caputred update');
    console.log(newArticle);
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

// Create the toolbar
function createToolbar(metadata, article){
    var newDiv = document.createElement("ul");
    newDiv.setAttribute('id', addonName+metadata['id']);

    // Add the buttons
    // Simple rate actions
    var buttonData = [
        {name: 'star-5',  value:  5, src: images['star-5']},
        {name: 'star-3',  value:  3, src: images['star-3']},
        {name: 'star-1',  value:  1, src: images['star-1']},
        {name: 'dislike', value: -1, src: images['dislike']},
    ];

    buttonData.map(function(item){
        var button = document.createElement("img");
        button.setAttribute('src', item.src);
        button.setAttribute('value', item.value);
        button.setAttribute('height', '25');
        var tmpFun = (function(metadata, mutable_data){
            return function() {
                emitFicData(metadata, mutable_data)
            };
        })(metadata, {'rating': item.value});
        $(button).click(
            tmpFun
        );
        newDiv.appendChild(button);
    });
    // If on an individual article page, add a bookmark bar
    if (article){
        var bookmark = document.createElement('img');
        bookmark.setAttribute('src', images['bookmark']);
        bookmark.setAttribute('height', '25');

        var bookmark_data = {
            'chapters_read': metadata['chapters_read'], 
            'chapter_id': metadata['chapter_id']
        };
        var tmpFun2 = (function(metadata, mutable_data){
            return function() {
                emitFicData(metadata, mutable_data)
            };
        })(metadata, bookmark_data);

        $(bookmark).click(
            tmpFun2
        );
        newDiv.appendChild(bookmark);
    }

    // Menu
    var menu = document.createElement("img");
    menu.setAttribute('src', images['menu']);
    menu.setAttribute('height', '25');
    $(menu).click(emitSettingsClick);
    newDiv.appendChild(menu);
    return newDiv;
}

function checkForBlacklistedArticle(workId){
    var ul_id = addonName + workId + 'blacklisted';
    if (!(ul_id.length)) {
        return false;
    }
    return $('#'+ul_id);
}


// The undo blacklister action is to reveal the article, then delete the
// div with the blacklister icon in it.
function undoBlacklist(workId){
    var blDiv = checkForBlacklistedArticle(workId);
    if (!(blDiv)) {
        // if it's not blacklisted, do nothing
        return;
    }
    console.log('undo bl');
    // reveal the siblings
    show(blDiv);
    blDiv.remove();
}


function hideByTag(raw_html, metadata){
    console.log('hiding');
    // create a placeholder element
    var newDiv = document.createElement("ul");
    newDiv.setAttribute('id', addonName + metadata['id'] + 'blacklisted');
    var img = document.createElement("img");
    img.setAttribute('width', '25');
    img.setAttribute('src', images['hidden']);


    var tmpFun = (function(metadata){
        return function() {
            undoBlacklist(metadata['id'])
        };
    })(metadata);
    $(img).click(
        tmpFun
    );

    newDiv.appendChild(img);

    var par = document.createElement("li");
    var text = document.createTextNode("hidden by "+ addonName +" blacklister");
    par.appendChild(text);
    newDiv.appendChild(par);
    // insert the placeholder element
    raw_html.appendChild(newDiv);
    // hide the article
    hide(newDiv); // Hide the sibilings of the new div
}

var processPage = (function (port){
    return function() {
        var ids = [];
        // Check if it's a browsing page, or a single article page
        if (checkIfArticlePage()) {
            ids = processArticlePage();
        } else {
            ids = processBrowsePage();
        }
        port.emit('doneprocessing', ids);
    }
})(self.port);

// When viewing a page, whether by a user or a crawl, we want to
// update several fields automatically.
// NOTE: this functions gets DUBLICATED in the crawler
// TODO: examine the necessity of the duplication
function onPageviewUpdater(){
    if (checkIfArticlePage()) {
        var info = parseArticlePage($('#main'));
        // Doesn't have mutable data, we are only checking the immutable
        var visit = new Date().toJSON().slice(0,10);
        emitFicData(info, {'visit': visit});
    } else {
        // TODO: implement updating of chapter information only for multi work
        // pages. Saves some crawl bandwidth, but a very low priority feature.
        ;
    }
}


$(document).ready(function() { 
        onPageviewUpdater();
}); 
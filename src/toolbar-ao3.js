/* ContentScript file for modifying the AO3 pages. Depends on ao3lib.

*/

function processPage(){
    var ids = [];
        // Check if it's a browsing page, or a single article page
    if (checkIfArticlePage()) {
        ids = processArticlePage();
    } else {
        ids = processBrowsePage();
    }
    // TODO: send message on complete
}

// TODO: incomming data
var images = {
    'star-shadow':chrome.extension.getURL('data/images/star-shadow.svg'),
    'star-0':chrome.extension.getURL('data/images/star-0.svg'),
    'star-1':chrome.extension.getURL('data/images/star-1.svg'),
    'star-3':chrome.extension.getURL('data/images/star-3.svg'),
    'star-5':chrome.extension.getURL('data/images/star-5.svg'),
    'star-1-fill':chrome.extension.getURL('data/images/star-1-fill.svg'),
    'star-3-fill':chrome.extension.getURL('data/images/star-3-fill.svg'),
    'star-5-fill':chrome.extension.getURL('data/images/star-5-fill.svg'),
    'hidden':chrome.extension.getURL('data/images/hidden.svg'),
    'hidden-shadow':chrome.extension.getURL('data/images/hidden-shadow.svg'),
    'dislike':chrome.extension.getURL('data/images/dislike.svg'),
    'dislike-fill':chrome.extension.getURL('data/images/dislike-fill.svg'),
    'dislike-shadow':chrome.extension.getURL('data/images/dislike-shadow.svg'),
    'menu':chrome.extension.getURL('data/images/menu.svg'),
    'menu-shadow':chrome.extension.getURL('data/images/menu-shadow.svg'),
    'flag':chrome.extension.getURL('data/images/flag.svg'),
    'unread':chrome.extension.getURL('data/images/unread.svg'),
    'read':chrome.extension.getURL('data/images/read.svg'),
    'bookmark':chrome.extension.getURL('data/images/bookmark.svg'),
    'bookmark-fill':chrome.extension.getURL('data/images/bookmark-fill.svg'),
    'bookmark-shadow':chrome.extension.getURL('data/images/bookmark-shadow.svg'),
};

var prefs = {};

// Create the toolbar
function createToolbar(metadata, article){
    var newDiv = document.createElement("ul");
    newDiv.setAttribute('id', addonName+metadata['ao3id']);

    // Unread icon
    var unread = document.createElement("img");
    unread.setAttribute('alt', 'read');
    var url = images['read'];
    unread.setAttribute('src', url);
    unread.setAttribute('alt', 'read');
    newDiv.appendChild(unread);

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
    $(menu).click(emitSettingsClick);
    newDiv.appendChild(menu);
    return newDiv;
}

function emitFicData(metadata, mutable_data){
    // TODO: implement this
    console.log(metadata, mutable_data);
}

function emitSettingsClick(){
    // TODO: implement this
    console.log('settings clicked');
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
    // reveal the siblings
    show(blDiv);
    blDiv.remove();
}


function hideByTag(raw_html, metadata){
    // create a placeholder element
    var newDiv = document.createElement("ul");
    newDiv.setAttribute('id', addonName + metadata['ao3id'] + 'blacklisted');
    var img = document.createElement("img");
    img.setAttribute('src', images['hidden']);


    var tmpFun = (function(metadata){
        return function() {
            undoBlacklist(metadata['ao3id'])
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

// When viewing a page by a user visit
// NOTE: this function is named the same, but slightly different from the one 
// in the crawler
function onPageviewUpdater(){
    if (checkIfArticlePage()) {
        var info = parseArticlePage($('#main'));
        console.log(info);
        // Doesn't have mutable data, we are only checking the immutable
        var visit = new Date().toJSON();
        emitFicData(info, {'visit': visit});
    } else {
        // TODO: implement updating of chapter information only for multi work
        // pages. Saves some crawl bandwidth, but a very low priority feature.
        ;
    }
}


$(document).ready(function() { 
    console.log('here');
    onPageviewUpdater();
    processPage(); // TODO: run this post data fetching instead of document on load
}); 

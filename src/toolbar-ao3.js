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
    return ids;
}

var prefs = {};

function createButton(src, alt, value, fun){
    var img = document.createElement("img");
    img.setAttribute('src', src);
    img.setAttribute('alt', alt);
    img.setAttribute('class', addonName + '-button');
    if (typeof value !== 'undefined') {
        img.setAttribute('value', value);
    }
    if (typeof fun !== 'undefined'){
        $(img).click(fun);
    }
    return img;
}

// Create the toolbar
function createToolbar(metadata, article){
    var newDiv = document.createElement("ul");
    newDiv.setAttribute('id', addonName+metadata['ao3id']);

    // Unread icon
    var unread = createButton(images['read'], 'read');
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
        var tmpFun = (function(metadata, mutable_data){
            return function() {
                emitFicData(metadata, mutable_data)
            };
        })(metadata, {'rating': item.value});

        var button = createButton(item.src, 'rate work '+item.value, item.value, tmpFun);
        newDiv.appendChild(button);

    });
    // If on an individual article page, add a bookmark bar
    if (article){

        var bookmark_data = {
            'chapters_read': metadata['chapters_read'], 
            'chapter_id': metadata['chapter_id']
        };
        var tmpFun2 = (function(metadata, mutable_data){
            return function() {
                emitFicData(metadata, mutable_data)
            };
        })(metadata, bookmark_data);

        var bookmark = createButton(
            images['bookmark'], 'set chapter bookmark', metadata['chapter_id'], tmpFun2);
        newDiv.appendChild(bookmark);
    }

    // Menu
    var menu = createButton(images['menu'], 'open settings page', '', emitSettingsClick);

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

function updateImage(newArticle){
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
    var ids = processPage();
    toolbar_onload(ids); // TODO: implement this for FF
}); 

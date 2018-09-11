/* ContentScript file for modifying the AO3 pages. Depends on ao3lib.

*/

// Not necessarily a user visit, just processing it
function processPage(raw_html){
    var ids = [];
        // Check if it's a browsing page, or a single article page
    if (checkIfArticlePage(raw_html)) {
        ids = processArticlePage(raw_html);
    } else {
        ids = processBrowsePage(raw_html);
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
    var outerEle = document.createElement("ul");
    outerEle.setAttribute('id', addonName+metadata['ao3id']);
    outerEle.setAttribute('class', addonName+'-toolbar-outer');

    var newDiv1 = document.createElement("div");
    newDiv1.setAttribute('class', addonName+'-toolbar-segment left-toolbar');

    var newDiv2 = document.createElement("div");
    newDiv2.setAttribute('class', addonName+'-toolbar-segment right-toolbar');

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
                if ($(this).attr('do-delete')) {
                    mutable_data['deleted'] = true;
                }
                emitFicData(metadata, mutable_data);
            };
        })(metadata, {'rating': item.value});

        var button = createButton(item.src, 'rate work '+item.value, item.value, tmpFun);
        newDiv1.appendChild(button);

    });

    // If on an individual article page, add a bookmark bar
    if (article){

        var bookmark_data = {
            'chapters_read': metadata['chapters_read'], 
            'chapter_id': metadata['chapter_id']
        };
        var tmpFun2 = (function(metadata, mutable_data){
            return function() {
                emitFicData(metadata, mutable_data);
            };
        })(metadata, bookmark_data);

        var bookmark = createButton(
            images['bookmark'], 'set chapter bookmark', metadata['chapter_id'], tmpFun2);
        newDiv2.appendChild(bookmark);
    }

    // Menu
    var menu = createButton(images['menu'], 'open settings page', '', emitSettingsClick);

    newDiv2.appendChild(menu);
    outerEle.appendChild(newDiv1);
    outerEle.appendChild(newDiv2);

    return outerEle;
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


function hideByTag(raw_html, metadata, matching_tags){
    var id_str = addonName + metadata['ao3id'] + 'blacklisted';
    // Don't hide if already hidden
    if ($('#' + id_str).length != 0){
        return;
    }
    // create a placeholder element
    var newDiv = document.createElement("ul");
    newDiv.setAttribute('id', id_str);

    var tmpFun = (function(metadata){
        return function() {
            undoBlacklist(metadata['ao3id'])
        };
    })(metadata);

    var button = createButton(
            images['hidden'], 'hidden by blacklister', metadata['chapter_id'], tmpFun);

    newDiv.appendChild(button);

    var par = document.createElement("li");
    var text = document.createTextNode("hidden for "+matching_tags.join(', '));
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
        if (newArticle.deleted){
            return;
        }
        // swap out the images
        setImage(ele, newArticle);
        // Also check if it was blacklisted, if so we want to undo it
        undoBlacklist(newArticle.ao3id);
    }
}


// When viewing a page by a user visit
function onPageviewUpdater(){
    if (checkIfArticlePage($("html").html())) {
        var info = parseArticlePage($('#main'));
        // Doesn't have mutable data, we are only checking the immutable
        var visit = new Date().toJSON();
        emitFicData(info, {'visit': visit});
    }
}

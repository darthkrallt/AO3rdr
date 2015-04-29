/* ContentScript file for modifying the AO3 pages. Depends on ao3lib.

*/

self.on('message', function onMessage(incomming_data) {
    images = incomming_data['images'];
    prefs = incomming_data['prefs'];
    platform = incomming_data['platform'];
    // will be 'android', 'Linux', 'Darwin', or 'WINNT'

    // Run the thing!
    processPage();
});

// You have to employ this little wrapper trick to get the self.port to work
// for your message passing to the main.js
var emitFicData = (function(port){
    return function(metadata, mutable_data) {
        var visit = new Date().toJSON();
        // You always want to include the date of visit when a toolbar action is performed
        mutable_data['visit'] = visit;
        port.emit('click', {"metadata":metadata, "mutable_data":mutable_data});
    };
})(self.port);

var emitSettingsClick = (function(port){
    return function(){
        port.emit('settingsclick', 1);
    };
})(self.port);


// Listening to updates after initial load
self.port.on('update', function(newArticle){
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
});

function createShadow(button_type, top_image){
    // button type is star, dislike, menu, hidden, or bookmark
    var div = document.createElement("div");
    div.style.float = 'left';
    div.style.position = 'relative';
    div.appendChild(top_image);
    // TODO: get this styling outta JS and into CSS! Gross!
    top_image.style.zIndex = '1';

    var img = document.createElement("img");
    img.setAttribute('alt', 'shadow');
    // NOTE: the "hidden" eye icon uses the WIDTH property instead
    // of the height. Do'h.
    if (button_type == 'hidden'){
        img.setAttribute('width', '25');
    } else {
        img.setAttribute('height', '25');
    }
    var url = images[button_type+'-shadow'];
    img.setAttribute('src', url);

    var onOver= (function(target){
        return function() {
            target.css('visibility', 'visible');
        };
    })($(img));
    var onOut= (function(target){
        return function() {
            target.css('visibility', 'hidden');
        };
    })($(img));
    $(div).hover(onOver, onOut);

    div.appendChild(img);
    // TODO: get this styling outta JS and into CSS! Gross!
    img.style.visibility = 'hidden';
    img.style.position = 'absolute';
    img.style.left = '0px';
    img.style.top = '0px';
    img.style.zIndex = '-1';

    return div;
}

// Create the toolbar
function createToolbar(metadata, article){
    var shadowOn = (platform != 'android');
    var newDiv = document.createElement("ul");
    newDiv.setAttribute('id', addonName+metadata['ao3id']);

    // Unread icon
    var unread = document.createElement("img");
    unread.setAttribute('alt', 'read');
    unread.setAttribute('height', '25');
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
        button.setAttribute('height', '25');
        var tmpFun = (function(metadata, mutable_data){
            return function() {
                emitFicData(metadata, mutable_data)
            };
        })(metadata, {'rating': item.value});
        $(button).click(
            tmpFun
        );
        // // NOTE this is to take care of the 'star-X' cases
        if(shadowOn){
            var button_type = item.name.split('-')[0];
            newDiv.appendChild(createShadow(button_type, button));
        } else {
            newDiv.appendChild(button);
        }
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
        if(shadowOn){
            newDiv.appendChild(createShadow('bookmark', bookmark));
        } else{
            newDiv.appendChild(bookmark);
        }
    }

    // Menu
    var menu = document.createElement("img");
    menu.setAttribute('src', images['menu']);
    menu.setAttribute('height', '25');
    $(menu).click(emitSettingsClick);
    // newDiv.appendChild(menu);
    newDiv.appendChild(createShadow('menu', menu));
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
    img.setAttribute('width', '25');
    img.setAttribute('src', images['hidden']);


    var tmpFun = (function(metadata){
        return function() {
            undoBlacklist(metadata['ao3id'])
        };
    })(metadata);
    $(img).click(
        tmpFun
    );

    // newDiv.appendChild(img);
    newDiv.appendChild(createShadow('hidden', img));

    var par = document.createElement("li");
    var text = document.createTextNode("hidden by "+ addonName +" blacklister");
    par.appendChild(text);
    newDiv.appendChild(par);
    // insert the placeholder element
    raw_html.appendChild(newDiv);
    // hide the article
    hide(newDiv); // Hide the sibilings of the new div
}

function preloadImages(){
    var div = document.createElement("div");
    div.style.visibility = 'hidden';
    div.style.display = 'none';
    var preloadMe = [
        images['star-1-fill'],
        images['star-2-fill'],
        images['star-3-fill'],
        images['dislike-fill'],
        images['bookmark-fill']
    ];
    for (var i in preloadMe){
        var img = document.createElement("img");
        var url = preloadMe[i];
        img.setAttribute('alt', 'preloaded-img-ignore');
        img.setAttribute('height', '25');
        div.appendChild(img);
        img.setAttribute('src', url);
    }
    // We can just remove it, since we're just tricking it to load
    div.remove();
}

var processPage = (function (port){
    return function() {
        var ids = [];
        preloadImages();
        // Check if it's a browsing page, or a single article page
        if (checkIfArticlePage()) {
            ids = processArticlePage();
        } else {
            ids = processBrowsePage();
        }
        port.emit('doneprocessing', ids);
    }
})(self.port);

// When viewing a page by a user visit
// NOTE: this function is named the same, but slightly different from the one 
// in the crawler
function onPageviewUpdater(){
    if (checkIfArticlePage()) {
        var info = parseArticlePage($('#main'));
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
    onPageviewUpdater();
}); 
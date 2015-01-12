// Can use jquery to select stuff
// Add in the floaty menu icons for the AO3 site
var addonName = 'dkrdr';

// Handle the message getting the image data on activation
var images = {};
self.on('message', function onMessage(incomming_data) {
    images = incomming_data;
    console.log(incomming_data);
    // Run the thing!
    processPage();
});

// You have to employ this little wrapper trick to get the self.port to work
// for your message passing to the main.js
var emitFicData = (function(port){
    return function(metadata, value) {
        console.log('inside emitterao3');
        console.log(metadata);
        port.emit('click', {metadata:metadata, value:value});
    };
})(self.port);

// Listening to updates after initial load
self.port.on('update', function(newArticle){
    console.log('caputred update');
    console.log(newArticle);
    // check for element
    var ele = checkForWork(newArticle.ao3id);
    if (ele) {
        // swap out the images
        setImage(ele, newArticle.level);
    }
});

function checkForWork(workId){
    console.log(addonName+workId);
    var ul_id = addonName+workId;
    return $('#'+ul_id);
}

function clearImage(html, level){
    var clearMe = $(html).find("img[src*='fill']");
    // TODO ...

}

function setImage(html, level){
    if (level > 0) {
        var ele = $(html).find("img[src*='star-"+level+"']");
        $(ele).attr('src', images['star-'+level+'-fill']);
        console.log(level);
    } else {
        var ele = $(html).find("img[src*='dislike']");
        $(ele).attr('src', images['dislike-fill']);
    }
}

// Create the toolbar
function createToolbar(metadata){
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
        button.setAttribute('width', '25');
        var tmpFun = (function(metadata, value){
            return function() {
                emitFicData(metadata, value)
            };
        })(metadata, item.value);
        $(button).click(
            tmpFun
        );
        // TODO: add some functionality to buttons
        newDiv.appendChild(button);
    });
    // Menu
    var menu = document.createElement("img");
    menu.setAttribute('src', images['menu']);
    menu.setAttribute('width', '25');
    newDiv.appendChild(menu);
    return newDiv;
}

// Extract Meta Information
// Parse the Work ID, title, and author from each work
function parseWorkBlurb(raw_html){
    var out = {};
    // the raw ID is in the format work_123456789, but we want just the number
    out['id'] = raw_html.id.slice(5);
    // once we have the spliced ID, we can find the title
    var url = '/works/' + out['id'];
    // TODO: Fix Bad escaping...
    //out['title'] = $(raw_html).find('a[href=' + url + ']').html();
    // For now, the workaround is to rely on the fact that title is 1st link
    out['title'] = $(raw_html).find('a').html();
    out['author'] = $(raw_html).find('a[rel=author]').html();
    return out;
}

// Go through the page, look for all the <li class="work blurb group" id="work_2707844" role="article">
function processPage(){
    console.log("processing page!");
    var articles = $("li[role=article]");
    for (var i=0; i< articles.length; i++){
        console.log("processed article");
        var info = parseWorkBlurb(articles[i]);
        console.log(info);
        toolbar = createToolbar(info);
        articles[i].appendChild(toolbar);
    };
    
}
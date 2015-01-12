// Note that this is a contentScript, so it gets attached by the main.js
var tableData = {};
var images = {};
var ao3baseLink = 'http://archiveofourown.org/works/';
var spinner = null;

self.port.on('attached', function onMessage(incomming_data) {
    tableData = incomming_data['data'];
    images = incomming_data['images'];
    prefs = incomming_data['prefs'];
    $('#enable-autofilter').attr('checked', prefs['autofilter']);
    $('#enable-autofilter').change(emitAutofilterToggle);
    // Hide the tags if the blacklist is disabled
    if (!prefs['autofilter'])
        $('#blacklist-wrapper').hide();

    $('#blacklist').val(incomming_data['prefs']['tags']);

    // Add the tag cloud function - it's important to set this AFTER 
    // we put the data in for the first time
    $('#blacklist').tagsInput({
        // my parameters here
        'onChange' : emitTagData,
        'height': '75px',
        'width': '100%',
    });

    console.log(tableData);
    // Do the initial loading of data into tables
    loadTable(tableData);
});

// HERE
self.port.on('allcrawlscomplete', function onMessage(incomming_data) {
    // stop spinner
    if (spinner){
        spinner.stop();
    }
    // Update all the table entries
});

var emitAutofilterToggle = (function(port){
    return function() {
        var val = $('#enable-autofilter').is(":checked");
        $('#blacklist-wrapper').toggle();
        console.log(val);
        port.emit('prefs', {'autofilter': val});
    };
})(self.port);

var emitTagData = (function(port){
    return function() {
        var taglist = $('#blacklist').val();
        console.log(taglist);
        port.emit('tags', taglist);
    };
})(self.port);


function generateImageHtml(data){
    var url = images['star-0'];
    if (parseInt(data['rating']) > 0){
        url = images['star-'+data['rating']+'-fill'];
    } else if (parseInt(data['rating']) == -1) {
        url = images['dislike-fill'];   
    }
    var img = document.createElement("img");
    img.setAttribute('src', url);
    img.setAttribute('alt', data['rating']);
    var html = document.createElement("td");
    html.appendChild(img);
    return html;
}

function generateAO3link(data){
    var url = ao3baseLink + data['ao3id'];
    if (data['chapter_id']) {
        // Add in the chapter ID if we have it
        return url + '/chapters/' + data['chapter_id'];
    }
    return url;
}

function generateUnreadHtml(data){
    var url = images['read'];
    var img = document.createElement("img");
    img.setAttribute('alt', 'read');
    if (data['read'] < data['chapters']['published']){
        url = images['unread'];
        img.setAttribute('alt', 'unread');
    }
    img.setAttribute('src', url);
    var html = document.createElement("td");
    html.appendChild(img);
    return html;
}

function generateAO3Html(data){
    var html = document.createElement("td");
    var url = document.createElement('a');
    url.setAttribute('href', generateAO3link(data));
    var text = document.createTextNode(data['ao3id']);
    url.appendChild(text);
    html.appendChild(url);
    return html;
}

function checkForUpdate(data){
    if (Date.parse(data['visit']) < Date.parse(data['updated'])){
        return true;
    }
    return false;
}

function generateUpdateHtml(data){
    var html = document.createElement("td");
    if (checkForUpdate(data)){
        var img = document.createElement("img");
        img.setAttribute('src', images['flag']);
        img.setAttribute('alt', '1');
        html.appendChild(img);
    }
    return html;
}

function generateChaptersHtml(data){
    var html = document.createElement("td");
    html.setAttribute('status', data['chapters']['complete']);
    var txt_str = data['chapters']['published'] + '/' + data['chapters']['total'];
    var text = document.createTextNode(txt_str);
    html.appendChild(text);
    return html;
}

function generateRowHtml(data){
/* Generate the HTML of a single row for the table. Also useful
   for updating!
*/
    var row = document.createElement('tr');
    row.setAttribute('id', data['ao3id']);
    // First generate the image
    row.appendChild(generateImageHtml(data));

    // Check if updated since user's last visit
    row.appendChild(generateUpdateHtml(data));

    // Check if there are unread chapters
    row.appendChild(generateUnreadHtml(data));

    // Author, Title, Updated, Last Visit all boring
    var boring = ['author', 'title', 'updated', 'visit', 'read'];
    for (var j in boring){
        var html = document.createElement("td");
        html.innerHTML = data[boring[j]]; // note it is already encoded
        //var text = document.createTextNode(tableData[i][boring[j]]);
        //html.appendChild(text);
        row.appendChild(html);
    }
    row.appendChild(generateChaptersHtml(data));
    // Now the link
    row.appendChild(generateAO3Html(data));
    return row;
}

function loadTable(tableData){
    // first generate the html
    var tableBody = $("#articlesTable").find('tbody');
    for (var i in tableData){
        var row = generateRowHtml(tableData[i]);
        tableBody.append(row);
    }
    // Need to let the tablesorter plugin know we made an update
    $("#articlesTable").trigger("update");
}

// Add tablesorter to the table
$(document).ready(function() { 
        $("#articlesTable").tablesorter({
            // Custom tablesorter configs
            // Extract alt from images for sorting them
            textExtraction:function(s){
            // Function from http://forum.jquery.com/topic/tablesorter-sort-image
                if($(s).find('img').length == 0) return $(s).text();
                    return $(s).find('img').attr('alt');
            }
        }); 
        // TODO: Add crawlrequest
        $('#crawl-updates').click(crawlForUpdates);
});

var crawlForUpdates = (function(port){
    return function(){
        // Ugly global...
        spinner = new Spinner().spin();

        $('#crawl-updates').parent().append(spinner.el);
        port.emit('crawlrequest');
    }
})(self.port);

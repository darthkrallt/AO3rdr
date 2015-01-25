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

    // Do the initial loading of data into tables
    loadTable(tableData);
});

self.port.on('allcrawlscomplete', function onMessage(incomming_data) {
    // stop spinner
    if (spinner){
        spinner.stop();
    }
    // Update all the table entries
    // If incomming_data is null, there were no entries crawled
    if (incomming_data){
        console.log('stuff crawled');
        // NOTE: for now incomming_data is a complete refresh of the data
        // TODO: for version 2.0 make this go row by row and unly update as necessary
        tableData = incomming_data;
        // drop the table
        $($('#articlesTable').find('tbody')).empty();
        // reload the table
        loadTable(tableData);
    }
});

self.port.on('exportcomplete', function onMessage(incomming_data) {
    console.log('inside exportcomplete');
    var content = JSON.stringify(incomming_data);
    var link = document.createElement('a');

    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    link.setAttribute('download', 'AO3rdr-backup.txt');
    link.setAttribute('visibility', 'hidden');
    link.setAttribute('display', 'none');

    document.body.appendChild(link);
    link.click();
});


var emitAutofilterToggle = (function(port){
    return function() {
        var val = $('#enable-autofilter').is(":checked");
        $('#blacklist-wrapper').toggle();
        port.emit('prefs', {'autofilter': val});
    };
})(self.port);

var emitTagData = (function(port){
    return function() {
        var taglist = $('#blacklist').val();
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
    img.setAttribute('height', '30');
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
    img.setAttribute('height', '30');
    if (data['read'] < data['chapters']['published']){
        url = images['unread'];
        img.setAttribute('alt', 'unread');
    }
    img.setAttribute('src', url);
    var html = document.createElement("td");
    html.appendChild(img);
    return html;
}

// function generateAO3Html(data){
//     var html = document.createElement("td");
//     var url = document.createElement('a');
//     url.setAttribute('href', generateAO3link(data));
//     var text = document.createTextNode(data['ao3id']);
//     url.appendChild(text);
//     html.appendChild(url);
//     return html;
// }

function checkForUpdate(data){
    // if (Date.parse(data['visit']) < Date.parse(data['updated'])){
    //     return true;
    // }
    // return false;
    return data['hasupdate'];
}

function generateUpdateHtml(data){
    var html = document.createElement("td");
    if (checkForUpdate(data)){
        var img = document.createElement("img");
        img.setAttribute('src', images['flag']);
        img.setAttribute('alt', '1');
        img.setAttribute('height', '30');
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
        // html.innerHTML = data[boring[j]]; // note it is already encoded
        if (((boring[j] == 'updated') || (boring[j] == 'visit')) && (data[boring[j]])){
            // It's a timestamp
            var text = document.createTextNode(data[boring[j]].slice(0, 10));
        } else if (boring[j] == 'title') {
            var text = document.createElement('a');
            text.setAttribute('href', generateAO3link(data));
            var text_str = document.createTextNode(data['title']);
            text.appendChild(text_str);
        } else {
            var text = document.createTextNode(data[boring[j]]);
        }
        html.appendChild(text);
        row.appendChild(html);
    }
    row.appendChild(generateChaptersHtml(data));
    return row;
}

function loadTable(tableData){
    // first generate the html
    var tableBody = $("#articlesTable").find('tbody');
    for (var i in tableData){
        var row = generateRowHtml(tableData[i]);
        tableBody.append(row);
    }
}

// Handle the file upload, NOTE only for single file upload
// Borrowed heavily from 
// http://stackoverflow.com/questions/7346563/loading-local-json-file
function handleFile(){
    var fileList = this.files;
    var file = fileList[0];
    var reader = new FileReader();
    reader.onload = recievedText;
    reader.readAsText(file);

    function recievedText(contents){
        lines = contents.target.result;
        var out = JSON.parse(lines);
        // Turn the "restore data" button on
        $('#restore-data').click(restoreData(out));
        $('#restore-data').attr('class', 'button-primary');
    }

}

var restoreData = (function(port){
    // This is really confusing! it returns a function to generate another function!
    return function(data){
        return function(){
            // send the data somewhere
            port.emit('restorefrombackup', data);
            $('#restore-data').click(null);
            $('#restore-data').attr('class', 'button');
        }
    }
})(self.port);

var requestBackup = (function(port){
    return function(){
        port.emit('exportdata');
    }
})(self.port);

// From this lovely stack overflow question, 
// http://stackoverflow.com/a/19947532/1533252
// since I keep getting rejected by
// Mozilla for tablesorter's single e-v-a-l function
// YOU DESERVE THIS FROWNEY FACE MOZILLA >:[
$('th').click(function(){
    var table = $(this).parents('table').eq(0)
    var rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()));
    this.asc = !this.asc;
    if (!this.asc){
        rows = rows.reverse();
    }
    for (var i = 0; i < rows.length; i++){
        table.append(rows[i]);
    }
});

function comparer(index) {
    return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index);
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
    }
}

// Since this isn't real tablesorter, you have to write your own value extractors here
function getCellValue(row, index){
    var out = '';
    if ($(row).children('td').eq(index).find('img').length != 0) {
        out = $(row).children('td').eq(index).find('img').attr('alt');
        
    } else if($(row).children('td').eq(index).find('a').length != 0){
        out = $(row).children('td').eq(index).find('a').text();
    } else {
        out = $(row).children('td').eq(index).html();
    }
    return out;
}

$(document).ready(function() { 
        $('#crawl-updates').click(crawlForUpdates);
        $('#upload-data').get(0).addEventListener('change', handleFile, false);
        $('#export-data').click(requestBackup);
});

var crawlForUpdates = (function(port){
    return function(){
        // Ugly global...
        spinner = new Spinner().spin();

        $('#crawl-updates').parent().append(spinner.el);
        port.emit('crawlrequest');
    }
})(self.port);

// Note that this is a contentScript, so it gets attached by the main.js

self.port.on('attached', function onMessage(incomming_data) {
    tableData = incomming_data['data'];
    images = incomming_data['images'];
    prefs = incomming_data['prefs'];
    onAttach(tableData, prefs);

});

function onAttach(tableData, prefs){
    onPrefs(prefs);
    // Do the initial loading of data into tables
    loadTable(tableData);
}

self.port.on('allcrawlscomplete', function onMessage(incomming_data) {
    crawlsComplete(incomming_data);
});

self.port.on('exportcomplete', function onMessage(incomming_data) {
    var content = JSON.stringify(incomming_data);
    var link = document.createElement('a');

    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    link.setAttribute('download', 'AO3rdr-backup.txt');
    link.setAttribute('visibility', 'hidden');
    link.setAttribute('display', 'none');

    document.body.appendChild(link);
    link.click();
});


var emitCloudSyncToggle = (function(port){
    return function() {
        var val = $('#enable-cloud-sync').is(":checked");
        port.emit('prefs', {'sync_enabled': val});
    };
})(self.port);

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

/* Cloud backup */
self.port.on('token-revealed', function onMessage(token) {
    $('#token-display').val(token);
    $('#id-token-box').fadeIn(500);
});

var revealToken = (function(port){
    return function(){
        port.emit('reveal-token');
    }
})(self.port);

self.port.on('token-saved', function onMessage(incomming_data) {
    var src = '';
    var msg = '';
    if (incomming_data['token_status'] == 'valid'){
        src = '../images/cloud-ok.svg';
        msg = 'Token OK';
        // Trigger a refresh of table data
        tableData = incomming_data['data'];
        // drop the table
        $($('#articlesTable').find('tbody')).empty();
        // reload the table
        loadTable(tableData);
        lastSyncUpdate();
    } else {
        src = '../images/cloud-offline.svg';
        msg = 'Token Invalid, try again.';
    }
    $('#token-check').children('.icon').attr('src', src);
    $('#token-check').children('p').text(msg);
    tokenSyncSpinner.stop();
});

var saveToken = (function(port){
    return function(){
        var token = $("#token-display").val();
        port.emit('save-token', token);
    }
})(self.port);

/* end Cloud backup */

var crawlForUpdates = (function(port){
    return function(){
        // Ugly global...
        spinner = new Spinner({position: 'relative'}).spin();

        $('#crawl-spinner').parent().append(spinner.el);
        port.emit('crawlrequest');
    }
})(self.port);

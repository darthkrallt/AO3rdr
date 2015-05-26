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
    onExportComplete(incomming_data);
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
    onTokenSave(incomming_data['token_status']);

    if (incomming_data['token_status'] == 'valid'){
        // Trigger a refresh of table data
        tableData = incomming_data['data'];
        // drop the table
        $($('#articlesTable').find('tbody')).empty();
        // reload the table
        loadTable(tableData);
        lastSyncUpdate();
    }
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


$(document).ready(function() { 
    addTablesorter();
});
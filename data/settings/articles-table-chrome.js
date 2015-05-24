var port = chrome.runtime.connect({name: "articles-table"});


function crawlForUpdates() {};

var requestBackup = (function(port){
    return function(){
        port.postMessage({message:'fetchdata', data: {'exportdata': true}});
    }
})(port);

var emitCloudSyncToggle = (function(port){
    return function() {
        var val = $('#enable-cloud-sync').is(":checked");
        port.postMessage({message: 'prefs', data: {'sync_enabled': val}});
    };
})(port);

var emitAutofilterToggle = (function(port){
    return function() {
        var val = $('#enable-autofilter').is(":checked");
        $('#blacklist-wrapper').toggle();
        port.postMessage({message: 'prefs', data: {'autofilter': val}});
    };
})(port);

var emitTagData = (function(port){
    return function() {
        var taglist = $('#blacklist').val();
        port.postMessage({message: 'prefs', data: {'tags': taglist}});
    };
})(port);


var revealToken = (function(port){
    return function(){
        console.log('revealToken');
        port.postMessage({message:'reveal-token'});
    }
})(port);

var restoreData = (function(port){
    // This is really confusing! it returns a function to generate another function!
    return function(fileData){
        return function(){
            // send the data somewhere
            port.postMessage({message: 'restorefrombackup', data: fileData});
            $('#restore-data').click(null);
            $('#restore-data').attr('class', 'button');
        }
    }
})(port);


port.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(JSON.stringify(request));
    if (request.message == 'token-revealed'){
        console.log(JSON.stringify(request));
        $('#token-display').val(request.data);
        $('#id-token-box').fadeIn(500);
    } else if (request.message == 'datadump') {
        if (request.data_type == 'prefs'){
            prefs = request.data.prefs;
            onPrefs(prefs);
        }
        if (request.data_type == 'ficdict') {
            tableData = request.data.ficdict;
            loadTable(tableData);
        }
        if (request.data_type == 'images'){
            images = request.data;
        }
        if (request.data_type == 'exportdata'){
            onExportComplete(request.data);
        }
    } else if (request.message == 'exportcomplete') {
        onExportComplete(incomming_data);
    } else if (request.message == 'newfic') {
        updateTableRow(request.data);
    };
});


$(document).ready(function() { 
    console.log('articles-table-chrome onready');
    port.postMessage({message: 'fetchdata', data: {images:true}});
    port.postMessage({message: 'fetchdata', data: {prefs: true, ficdict: true}});
});
var artPort = chrome.runtime.connect({name: "articles-table"});


function crawlForUpdates() {};

var requestBackup = (function(artPort){
    return function(){
        artPort.postMessage({message:'fetchdata', data: {'exportdata': true}});
    }
})(artPort);

var emitCloudSyncToggle = (function(artPort){
    return function() {
        var val = $('#enable-cloud-sync').is(":checked");
        artPort.postMessage({message: 'prefs', data: {'sync_enabled': val}});
    };
})(artPort);

var emitAutofilterToggle = (function(artPort){
    return function() {
        var val = $('#enable-autofilter').is(":checked");
        $('#blacklist-wrapper').toggle();
        artPort.postMessage({message: 'prefs', data: {'autofilter': val}});
    };
})(artPort);

var emitTagData = (function(artPort){
    return function() {
        var taglist = $('#blacklist').val();
        artPort.postMessage({message: 'prefs', data: {'tags': taglist}});
    };
})(artPort);


var revealToken = (function(artPort){
    return function(){
        artPort.postMessage({message:'reveal-token'});
    }
})(artPort);

var saveToken = (function(artPort){
    return function(){
        var token = $("#token-display").val();
        artPort.postMessage({message: 'save-token', data:token});
    }
})(artPort);

var restoreData = (function(artPort){
    // This is really confusing! it returns a function to generate another function!
    return function(fileData){
        return function(){
            // send the data somewhere
            artPort.postMessage({message: 'restorefrombackup', data: fileData});
            $('#restore-data').click(null);
            $('#restore-data').attr('class', 'button');
        }
    }
})(artPort);


artPort.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == 'token-revealed'){
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
    } else if (request.message == 'token-saved') {
        onTokenSave(request.data['token_status']);
    };
});


$(document).ready(function() { 
    artPort.postMessage({message: 'fetchdata', data: {images:true}});
    artPort.postMessage({message: 'fetchdata', data: {prefs: true, ficdict: true}});
});
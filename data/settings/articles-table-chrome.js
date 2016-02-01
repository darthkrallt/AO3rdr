var artPort = chrome.runtime.connect({name: "articles-table"});

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


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    articles_listener(request)
});

artPort.onMessage.addListener(function(request, sender, sendResponse) {
    articles_listener(request);
});

function articles_listener(request){
    switch (request.message) {
        case 'images':
            images = request.data;
            break;
        case 'token-revealed':
            $('#token-display').val(request.data);
            $('#id-token-box').fadeIn(500);
            break;
        case 'exportcomplete':
            onExportComplete(incomming_data);
            break;
        case 'newfic':
            updateTableRow(request.data);
            break;
        case 'token-saved':
            onTokenSave(request.data['token_status']);
            break;
        case 'datadump':
            datadumper(request);
            break;
        default:
            console.log('responder missed in table');
            break;
    }
}


function datadumper(request){
    switch (request.data_type){
        case 'images':
            images = request.data;
            break;
        case 'prefs':
            prefs = request.data.prefs;
            onPrefs(prefs);
            break;
        case 'ficdict':
            tableData = request.data.ficdict;
            loadTable(tableData);
            break;
        case 'exportdata':
            onExportComplete(request.data);
            break;
        default:
            console.log('datadumper missed in table');
            break;

    }
}


$(document).ready(function() { 
    artPort.postMessage({message: 'fetchdata', data: {images:true}});
    artPort.postMessage({message: 'fetchdata', data: {prefs: true, ficdict: true}});
});
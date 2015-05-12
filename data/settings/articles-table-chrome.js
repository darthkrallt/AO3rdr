var port = chrome.runtime.connect({name: "articles-table"});


function crawlForUpdates() {}
function requestBackup() {}
function handleFile() {}
function emitAutofilterToggle() {}
function emitCloudSyncToggle() {}
function emitTagData() {}

var revealToken = (function(port){
    return function(){
        console.log('revealToken');
        port.postMessage({message:'reveal-token'});
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
    }
});

$(document).ready(function() { 
    console.log('articles-table-chrome onready');
    port.postMessage({message: 'fetchdata', data: {images:true}});
    port.postMessage({message: 'fetchdata', data: {prefs: true, ficdict: true}});
});
var port = chrome.runtime.connect({name: "articles-table"});


function crawlForUpdates() {}
function requestBackup() {}
function handleFile() {}

var revealToken = (function(port){
    return function(){
        console.log('revealToken');
        port.postMessage({message:'reveal-token'});
    }
})(port);


port.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == 'token-revealed'){
        console.log(JSON.stringify(request));
        $('#token-display').val(request.data);
        $('#id-token-box').fadeIn(500);
    }
});
var artPort = chrome.runtime.connect({name: "articles-table"});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    articles_listener(request)
});

artPort.onMessage.addListener(function(request, sender, sendResponse) {
    articles_listener(request);
});

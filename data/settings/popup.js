var popPort = chrome.runtime.connect({name: "popup"});

$(document).ready(function() { 
    console.log('popup');
    popPort.postMessage({message: 'fetchdata', data: {ficdict: true}});
    // Add yer clicks
    $('a.bookmarks').click(function(){
        chrome.tabs.create({url: chrome.extension.getURL('data/settings/index.html')});
    });
    $('a.credits').click(function(){
        chrome.tabs.create({url: chrome.extension.getURL('data/settings/credits.html')});
    });
    $('a.ao3').click(function(){
        chrome.tabs.create({url: 'https://archiveofourown.org/'});
    });
});

popPort.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == 'datadump') {
        if (request.data_type == 'ficdict') {
            tableData = request.data.ficdict;
            console.log(tableData);
            processTopTen(tableData);
        }

    }
});

function processTopTen(ficdict){
    console.log(ficdict);
    var values = Object.keys(ficdict).map(function(key){
        return ficdict[key];
    });

    console.log(values);

    var onlyGood = values.filter(
        function (el) {
          return el.rating > 0;
        }
    );

    console.log(onlyGood);

    onlyGood.sort(function (a, b) {
        return (new Date(a.visit)).getTime() - (new Date(b.visit)).getTime();
    });
    console.log(onlyGood.slice(0,10));
    loadTenTable(onlyGood.slice(0,10));

}

function generateRowHtmlPopup(data){
/* Generate the HTML of a single row for the table. Also useful
   for updating!
*/
    var row = document.createElement('tr');
    row.setAttribute('id', data['ao3id']);

    // First generate the icons and append
    var html = document.createElement("td");
    html.appendChild(generateStarImage(data, 20));
    html.appendChild(generateUnreadImage(data, 20));
    console.log(html);
    row.appendChild(html);

    // Author, Title, Updated, Last Visit all boring
    var boring = ['author', 'title'];
    for (var j in boring){
        var html = document.createElement("td");
        // html.innerHTML = data[boring[j]]; // note it is already encoded
        if (boring[j] == 'title') {
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
    return row;
}

function loadTenTable(tableData){
    // first generate the html
    var tableBody = $("#topTenTable").find('tbody');
    // Empty it first
    $(tableBody).empty();
    for (var i in tableData){
        try {
            var row = generateRowHtmlPopup(tableData[i]);
            tableBody.append(row);
        }
        catch (error) {
            console.log("Bad row loading table: ", tableData[i]);
            console.log(error);
        }
    }
}
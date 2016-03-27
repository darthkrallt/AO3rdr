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
          return (el.rating > 0) && (!el.deleted);
        }
    );

    console.log(onlyGood);

    onlyGood.sort(function (a, b) {
        return (new Date(a.visit)).getTime() - (new Date(b.visit)).getTime();
    });
    loadTenTable(onlyGood.slice(0,10));

}

function generateRowHtmlPopup(data){
/* Generate the HTML of a single row for the table. Also useful
   for updating!
*/

/*<div class="header">
  <img src="http://dummyimage.com/100/000000/fff" />
  <h1>Hello world</h1>
  <h2>This is a subtitle</h2>
  <div class="clear"></div>
</div*/

    var row = document.createElement('li');
    row.setAttribute('id', data['ao3id']);

    // First generate the icons and append
    var img = generateStarImage(data, 15);
    img.style.paddingRight = '0.2em';
    //img.style.float = 'left';
    row.appendChild(img);


    // Author, Title, Updated, Last Visit all boring
    var link = document.createElement('a');
    var url =  generateAO3link(data);
    link.onclick = function(){chrome.tabs.create({'url': url})};
    // Technically setting this arrt does nothing, but makes mouse over outline work
    link.setAttribute('href', generateAO3link(data));

    var text_str = document.createTextNode(safeDecode(data['title']));
    link.appendChild(text_str);
    row.appendChild(link);

    img = generateUnreadImage(data, 15);
    img.style.paddingLeft = '0.2em';
    row.appendChild(img);

    var dd = document.createElement('dd');
    dd.style.fontSize = '0.75em';


    var text = document.createTextNode(safeDecode(data['author']));
    dd.appendChild(text);
    
    row.appendChild(dd);


    return row;
}

function loadTenTable(tableData){
    tableData.reverse();
    // first generate the html
    var tableBody = $("#topTen");
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
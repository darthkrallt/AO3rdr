var ao3baseLink = 'https://archiveofourown.org/works/';

function safeDecode(encoded){
    return $('<textarea/>').html(encoded).val();
}

function generateStarImage(data, size){
    var url = images['star-0'];
    if (parseInt(data['rating']) > 0){
        url = images['star-'+data['rating']+'-fill'];
    } else if (parseInt(data['rating']) == -1) {
        url = images['dislike-fill'];   
    }
    if ((data['rating'] == "delete") || (data.deleted)){
        url = images['delete-fill'];
    }
    var img = document.createElement("img");
    img.setAttribute('src', url);
    img.setAttribute('height', size);
    img.setAttribute('alt', data['rating']);
    return img;
}

function generateUnreadImage(data, size){
    var url = images['read'];
    var img = document.createElement("img");
    img.setAttribute('alt', 'read');
    img.setAttribute('height', size);
    if (data['read'] < data['chapters']['published']){
        url = images['unread'];
        img.setAttribute('alt', 'unread');
    }
    img.setAttribute('src', url);
    return img;
}

// TODO: merge these
function generateImageHtml(data){
    var img = generateStarImage(data, 30);
    var html = document.createElement("td");
    html.appendChild(img);
    return html;
}

function generateUnreadHtml(data){
    var img = generateUnreadImage(data, 30);
    var html = document.createElement("td");
    html.appendChild(img);
    return html;
}

function generateAO3link(data){
    var url = ao3baseLink + data['ao3id'];
    if (data['chapter_id']) {
        // Add in the chapter ID if we have it
        return url + '/chapters/' + data['chapter_id'];
    }
    return url;
}

function generateChaptersHtml(data){
    var html = document.createElement("td");
    html.setAttribute('status', data['chapters']['complete']);
    var txt_str = data['chapters']['published'] + '/' + data['chapters']['total'];
    var text = document.createTextNode(txt_str);
    html.appendChild(text);
    return html;
}

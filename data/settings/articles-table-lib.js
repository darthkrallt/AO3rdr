var ao3baseLink = 'http://archiveofourown.org/works/';

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

function generateTableCheckbox(data){

    function checkboxToggle(){
        var row = $(this).closest('tr');
        $(row).toggleClass('selected');
        var checkbox = $(row).find('input[type="checkbox"]');
    }

    var inp = document.createElement("input");
    inp.setAttribute('name', "id[]");
    inp.setAttribute("value", data['ao3id']);
    inp.setAttribute("type", "checkbox");
    $(inp).click(checkboxToggle);
    var html = document.createElement("td");
    html.appendChild(inp);
    return html;
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

function createModal(body, confirm_action, confirm_message){
    var overlay_div = document.createElement("div");
    overlay_div.setAttribute("class", "modal_overlay");

    var modal_div = document.createElement("div");
    modal_div.setAttribute("id", "modal_div");
    modal_div.setAttribute("class", "modal box four columns");
    if (typeof body == "string"){
        var append_me = document.createElement("p");
        $(append_me).text(body);
        modal_div.appendChild(append_me);
    } else {
        modal_div.appendChild(body);
    }

    var confirm_button = document.createElement("input");
    confirm_button.setAttribute("class", "button-primary");
    confirm_button.setAttribute("type", "button");
    confirm_button.setAttribute("value", confirm_message);

    var cancel_button = document.createElement("input");
    cancel_button.setAttribute("class", "button-secondary");
    cancel_button.setAttribute("type", "button");
    cancel_button.setAttribute("value", "Cancel");

     function close_modal(){
        $($(this).parent('div.modal')).parent('div.modal_overlay').remove();
    }
    $(cancel_button).click(close_modal);
    //$(overlay_div).click(close_modal);


    var confirm_close = (function(confirm_action){
        return function() {
            confirm_action();
            $($(this).parent('div.modal')).parent('div.modal_overlay').remove();
        };
    })(confirm_action);

    $(confirm_button).click(confirm_close);

    modal_div.appendChild(confirm_button);
    modal_div.appendChild(cancel_button);
    overlay_div.appendChild(modal_div);
    document.body.appendChild(overlay_div);
}


function addEditDropdown(){
    var ddData = [
        {
            text: "Awesome",
            value: 5,
            selected: false,
            imageSrc: images['star-5-fill']
        },
        {
            text: "Good",
            value: 3,
            selected: false,
            imageSrc: images['star-3-fill']
        },
        {
            text: "Meh",
            value: 1,
            selected: false,
            imageSrc: images['star-1-fill']
        },
        {
            text: "Dislike",
            value: -1,
            selected: false,
            imageSrc: images['dislike-fill']
        },
        {
            text: "Delete",
            value: "delete",
            selected: false,
            imageSrc: images['delete-fill']
        },
    ];

    var dds = document.createElement("div");
    dds.setAttribute("id", "ddslick-edit-works");

    $('#articlesTable_wrapper').prepend(dds);

    // Add the interactive dropdown
    $('#ddslick-edit-works').ddslick({
        data: ddData,
        width: 150,
        selectText: "Edit Selected",
        onSelected: function (data) {
            var run_me = (function(update_value){ return function(){updateWorks(update_value)} })(data.selectedData.value);
            createModal(generateModalDialogue(data.selectedData),run_me, 'Confirm');
        }
    });
}

function updateWorks(update_value){
    var update_data = {};
    if (update_value == "delete"){
        update_data['deleted'] = true;
    } else {
        update_data['rating'] = update_value;
    }
    $( $('#articlesTable').find('input:checked') ).each(function( index ) {
        var ao3id = $( this ).attr('value');
        emitWorkEdit(ao3id, update_data);
    });
}

function generateModalDialogue(selectedData){
    var selected = $('#articlesTable').find('input:checked');
    if (selected.length == 0){
        return "No works selected!";
    }
    var p = document.createElement("p");
    var img = generateStarImage({'rating': selectedData.value}, 25);

    var text = "Change "+ selected.length + " to " + selectedData.text + "(";
    if (selectedData.value == "delete"){
        var text = "Delete " + selected.length + " works (";
    }
    $(p).text(text);
    $(p).append(img);
    $(p).append(")?");
    return p;
}
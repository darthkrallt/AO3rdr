var tableData = {};
var spinner = null;
var tokenSyncSpinner = null;

function onPrefs(prefs){
    $('#enable-autofilter').attr('checked', prefs['autofilter']);
    $('#enable-cloud-sync').attr('checked', prefs['sync_enabled']);

    // Show the hellobar if necessary
    helloBarRender(prefs);

    // Hide the tags if the blacklist is disabled
    if (!prefs['autofilter'])
        $('#blacklist-wrapper').hide();

    lastSyncUpdate();

    var tags = prefs['tags'];
    if (Array.isArray(tags))
        tags = tags.join(',');
    // Do nothing if the tags haven't actually changed.
    if (tags == $('#blacklist').val()){
        return;
    }

    // Unbind, then rebind the onchange so this doesn't trigger it
    $('#blacklist').importTags(tags);

}

function helloBarRender(prefs) {
    if ($('#hellobar-box').css("display") == 'block')
        return;  // Noop if already showing
    var bar = prefs["hello_bar"];
    // Make sure that the message is still valid
    timeNow = Date.now() / 1000.0;
    if (bar['created_at'] < timeNow && bar['expires_at'] > timeNow) {
        if ((typeof prefs["hello_bar_dismissed"] === 'undefined') || bar['created_at'] > prefs["hello_bar_dismissed"]) {
            // Add the message contents
            $('#hellobar-message').append(bar['text']);
            $('#hellobar-box').css("display", 'block');
        }
    }
    $($('#hellobar-box').children('.boxclose')[0]).click(dismissHello);

}


function onTokenSave(token_status, token){
    var src = '';
    var msg = '';
    if (token_status == 'valid'){
        src = '../images/cloud-ok.svg';
        msg = 'Token OK';
    } else {
        src = '../images/cloud-offline.svg';
        msg = 'Token Invalid, try again.';
    }
    $('#token-check').children('.icon').attr('src', src);
    $('#token-check').children('p').text(msg);
    // tokenSyncSpinner.stop(); // TODO: fix spinner
}


function generateRowHtml(data){
/* Generate the HTML of a single row for the table. Also useful
   for updating!
*/
    var row = document.createElement('tr');
    row.setAttribute('id', data['ao3id']);
    // First generate the checkbox
    row.appendChild(generateTableCheckbox(data));

    // Then generate the image
    row.appendChild(generateImageHtml(data));

    // Check if there are unread chapters
    row.appendChild(generateUnreadHtml(data));

    // Author, Title, Updated, Last Visit all boring
    var boring = ['author', 'title', 'fandom', 'updated', 'visit'];
    var fixme_string = 'please click to update';
    // Shim in place for fandom
    if (!data['fandom'])
        data['fandom'] = fixme_string;
    for (var j in boring){
        var html = document.createElement("td");
        // html.innerHTML = data[boring[j]]; // note it is already encoded
        if (((boring[j] == 'updated') || (boring[j] == 'visit')) && (data[boring[j]])){
            // It's a timestamp
            var text = '?';
            if (boring['j'] == 'visit'){
                // NOTE the visit is UTC, since we set it
                var d = new Date(data[boring[j]]);
                // epochConverterLocaleString returns MM/DD/YYYY. Yuck. Fix that.
                text = new Date(d.epochConverterLocaleString()).toJSON().slice(0, 10);
            } else {
                // However the others are crawled, assume AO3 has the right timezone
                text = data[boring[j]].slice(0, 10);
            }
            var text = document.createTextNode(text);
        } else if (boring[j] == 'title' || data[boring[j]] == fixme_string) {
            var text = document.createElement('a');
            text.setAttribute('href', generateAO3link(data));
            var text_str = document.createTextNode(safeDecode(data[boring[j]]));
            text.appendChild(text_str);
        } else {
            var text = document.createTextNode(safeDecode(data[boring[j]]));
        }
        html.appendChild(text);
        row.appendChild(html);
    }
    row.appendChild(generateChaptersHtml(data));
    return row;
}


function loadTable(tableData){
    // first generate the html
    var tableBody = $("#articlesTable").find('tbody');
    // Empty it first
    $(tableBody).empty();
    for (var i in tableData){
        try {
            var perm_deleted = tableData[i].deleted && ((new Date().getTime() / 1000) - tableData[i].deleted__ts > 60)
            if (perm_deleted){
                continue;
            }
            var row = generateRowHtml(tableData[i]);
            tableBody.append(row);
        }
        catch (error) {
            console.log("Bad row loading table: ", tableData[i]);
            console.log(error);
        }
    }
    // Datatables is chrome only because of "dangerous" functions
    $('#articlesTable').dataTable({
        columnDefs: [
            {
                'targets': 0,
                'searchable': false,
                'orderable': false,
                'className': 'dt-body-center',
            },
            { type: 'alt-string', targets: [1, 2] },
            { type: 'html', targets: 4 },
            { "visible": false, targets: [2, 6, 7]},
        ],
        "order": [[ 0, "desc" ]],
    });

}

function updateTableRow(rowData){
    var tableBody = $("#articlesTable").find('tbody');
    var ele = $('#' + rowData['ao3id']);
    var row = generateRowHtml(rowData);

    if (ele.length){
        ele.replaceWith(row);
    }
    else{
        tableBody.append(row);
    }
    var table = $('#articlesTable').DataTable();
    table.row.add($(row));

}

function lastSyncUpdate(){
    var utcSeconds = prefs['last_sync'];
    var msg = 'Last Sync: Not yet synced';
    var src = '../images/cloud-offline.svg';
    if (!prefs['sync_enabled']){
        msg = 'Sync Disabled';
    }
    else if (utcSeconds){
        var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
        d.setUTCSeconds(utcSeconds);
        msg = d.toLocaleString();
        src = '../images/cloud-ok.svg';
    }
    $('#cloud-sync-status').children('.icon').attr('src', src);
    $('#cloud-sync-status').children('p').text(msg);

    $('#last-sync').text(msg);
    // Enable sync again
    toggleSync(true);
}


function toggleSync(is_enabled){
    if (is_enabled){
        $('#sync-now').addClass( 'button-primary' );
        $('#sync-now').removeClass( 'button' );
        $('#sync-now').click(
            function() {
                syncNow();
            }
        );
    } else {
        $('#sync-now').addClass( 'button' );
        $('#sync-now').removeClass( 'button-primary' );
        $('#sync-now').click(
            function() {
            }
        );
    }
}

// Handle the file upload, NOTE only for single file upload
// Borrowed heavily from 
// http://stackoverflow.com/questions/7346563/loading-local-json-file
function handleFile(){
    var fileList = this.files;
    var file = fileList[0];
    var reader = new FileReader();
    reader.onload = recievedText;
    reader.readAsText(file);

    function recievedText(contents){
        lines = contents.target.result;
        var out = JSON.parse(lines);
        // Turn the "restore data" button on
        $('#restore-data').click(restoreData(out));
        $('#restore-data').attr('class', 'button-primary');
    }

}

function onExportComplete(incomming_data){
    var content = JSON.stringify(incomming_data);
    var link = document.createElement('a');
    var d = new Date();
    var d_string = d.toISOString().split('T')[0];

    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    link.setAttribute('download', 'AO3rdr-backup-'+d_string+'.txt');
    link.setAttribute('visibility', 'hidden');
    link.setAttribute('display', 'none');

    document.body.appendChild(link);
    link.click();
}

$(document).ready(function() { 
    $('#upload-data').get(0).addEventListener('change', handleFile, false);
    $('#export-data').click(requestBackup);

    $('#enable-autofilter').change(emitAutofilterToggle);
    $('#enable-cloud-sync').change(emitCloudSyncToggle);

    // Attach click function to close buttons
    $( ".boxclose" ).each( function( index, element ){
        // Do something
        $(this).click(
            function(){
                // clicking the close span causes the closest ancestor modal to fadeout
                var buttonId = $(this).closest('.box')[0].id + '-button';
                $(this).closest('.box').fadeOut(500);
                $('#'+buttonId).fadeIn(500);
            }
        );
    });
    // Attach click function to "reopen" buttons
    $( ".boxopen" ).each( function(index, element){
        $(this).click(function(){
            $(this).fadeOut(500);
            var boxId = this.id.split('-button')[0];
            $('#'+boxId).fadeIn(500);
        });
    });

    // Arrach the click functions
    $('#reveal-token').click(
        function() {
            revealToken('token-revealed');
            //$('#id-token-box').fadeIn(500);
        }
    );
    $('#save-token').click(
        function() {
            // TODO: fix spinner
            //tokenSyncSpinner = new Spinner({position: 'relative'}).spin();
            //$('#id-token-box').append(tokenSyncSpinner.el);
            saveToken();
        }
    );
    $('#sync-now').click(
        function() {
            syncNow();
        }
    );
    $('#blacklist').tagsInput({
        // my parameters here
        'onAddTag' : emitTagData,
        'onRemoveTag': emitTagData,
        'height': '75px',
        'width': '100%',
    });
    // Functionality for toggling table columns
    $('a.toggle-vis').on( 'click', function (e) {
        if (e.target.type != 'checkbox')
            e.preventDefault();
 
        // Get the column API object
        var col_number = $(this).attr('data-column');
        var column = $('#articlesTable').DataTable().column( col_number );
 
        // Toggle the visibility
        column.visible( ! column.visible() );
        var rel_checkbox = $('a[data-column='+col_number+']').find('input');
        $(rel_checkbox).prop('checked', column.visible());
    } );
});

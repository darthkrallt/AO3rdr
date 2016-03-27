// From this lovely stack overflow question, 
// http://stackoverflow.com/a/19947532/1533252
// since I keep getting rejected by
// Mozilla for tablesorter's e-v-a-l function

function addTablesorter(){
    $('th').click(function(){
        var table = $(this).parents('table').eq(0)
        var rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()));
        this.asc = !this.asc;
        if (!this.asc){
            rows = rows.reverse();
        }
        for (var i = 0; i < rows.length; i++){
            table.append(rows[i]);
        }
    });
}

function comparer(index) {
    return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index);
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
    }
}

// Since this isn't real tablesorter, you have to write your own value extractors here
function getCellValue(row, index){
    var out = '';
    if ($(row).children('td').eq(index).find('img').length != 0) {
        out = $(row).children('td').eq(index).find('img').attr('alt');
        
    } else if($(row).children('td').eq(index).find('a').length != 0){
        out = $(row).children('td').eq(index).find('a').text();
    } else {
        out = $(row).children('td').eq(index).html();
    }
    return out;
}
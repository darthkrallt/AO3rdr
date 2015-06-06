/*  Common core functions used for accessing the ao3 site. Used by both the
    crawler and the toolbar scripts.
*/
var addonName = 'ao3rdr';

// Handle the message getting the image data on activation
var images = {};
var prefs = {};


function extractChapterIdFromPage(){
    var chapter_section = $('div[class=chapter]');
    if (chapter_section.attr('id')){
        var chapter_url = chapter_section.find('a').attr('href');
        return chapter_url.split('chapters/')[1];
    }
    return null;
}

function checkForWork(workId){
    var ul_id = addonName+workId;
    if (!(ul_id.length)) {
        return false;
    }
    return $('#'+ul_id);
}

function clearImage(html){
    // Note: in the case of a "0" rating, we want to clear all filled images
    var clearMe = $(html).find("img[src*='fill']");
    for (var i = 0; i < clearMe.length; i++){
        var level = $(clearMe[i]).attr('value');
        if (parseInt(level) >= 0) {
            $(clearMe[i]).attr('src', images['star-'+level]);
        } else if (parseInt(level) <= 0 ){
            $(clearMe[i]).attr('src', images['dislike']);
            show($(clearMe[i]).parent());
        }
    };

}

// TODO: reformat this ugly global.
var pageChapter = extractChapterIdFromPage();

function setImage(html, stored_data){
    level = parseInt(stored_data.rating);

    if (level > 0) {
        var ele = $(html).find("img[src*='star-"+level+"']");
        $(ele).attr('src', images['star-'+level+'-fill']);
    } else if (level == -1) {
        var ele = $(html).find("img[src*='dislike.svg']");
        $(ele).attr('src', images['dislike-fill']);
        hide(ele.parent());
    }

    // Make sure that it's visible for positive raing (eg, undoing neg rating)
    if (level >= 0){
        show(ele.parent());
    }

    if (stored_data.chapter_id == pageChapter) {
        // change the image
        var ele = $(html).find("img[src*='bookmark.svg']");
        $(ele).attr('src', images['bookmark-fill']);
    }

    if (stored_data.read < stored_data.chapters['published']){
        var ele = $(html).find("img[src*='read']");
        $(ele).attr('src', images['unread']);
        $(ele).attr('alt', 'unread');
    }
}

function hide(parent){
    $(parent).siblings().hide();
}

function show(parent){
    $(parent).siblings().show();
}


function parseChapters(raw_html){
    // Chapter information is a string X/Y where X is the number of
    // chapters completed, and Y is total. Y may be a ? if author doesn't know
    // how long the work will be.
    var stats = $(raw_html).find('dl[class=stats]').children();
    var raw_string = '';
    for (var i = 0; i< stats.length; i+=2){
        // going by 2's through stats
        if ($(stats[i]).html() == 'Chapters:') {
            // Only overwrite if null
            raw_string = $(stats[i+1]).html();
        }
    }
    var raw_chapters = raw_string.split('/');
    var out = {
        'published': raw_chapters[0],
        'total': raw_chapters[1],
        'complete': false,
    };
    if (out['published'] == out['total']) {
        out['complete'] = true;
    }
    return out;
}

function parseArticlePage(raw_html){
/* Extract Information from an article page
*/
    var out = {};
    // Title, Author are in preface group
    out['author'] = $(raw_html).find('a[rel=author]').html();
    var raw = $(raw_html).find("h2[class='title heading']").html();
    // AO3 has weird whitespace around the title on this page, strip it!
    out['title'] = $.trim(raw);

    // id - HACK - extracting it from the hidden kudos field
    out['ao3id'] = $(raw_html).find('#kudo_commentable_id').val();

    // Look for Updated, then fall back on Published
    // Note that Updated can be assumed to be listed after published
    var stats = $('div').find('dl[class=stats]').children();
    var raw_date = null;
    for (var i = 0; i< stats.length; i+=2){
        // going by 2's through stats
        var key = $(stats[i]).html();
        var value = $(stats[i+1]).html();
        if ((key == 'Published:') || (key == 'Updated:')) {
            // Only overwrite if null
            raw_date =  value || raw_date;
        } else if (key == 'Words:'){
            out['wordcount'] =  parseFloat(value.replace(',' ,''));
        }
    }
    out['updated'] = new Date(Date.parse(raw_date)).toJSON();

    out['chapters'] = parseChapters(raw_html);
    // Assume we've read up to this page if we are adding the bookmark from it.
    // chapter data is stored in this div's id as "chapter-X"

    var chapter_section = raw_html.find('div[class=chapter]');

    // Only do this if the chapters section is defined
    if (chapter_section.attr('id')){
        out['chapters_read'] = chapter_section.attr('id').split('chapter-')[1];
        // We also want the chapter id
        var chapter_url = chapter_section.find('a').attr('href');
        out['chapter_id'] = chapter_url.split('chapters/')[1];
    } else {
        // On a one chapter work, assume we have read the page we're on
        out['chapters_read'] = 1;
    }

    return out;
}

// Extract Meta Information
// Parse the Work ID, title, and author from each work
function parseWorkBlurb(raw_html){
    var out = {};
    var header_div = $($($(raw_html).find('div[class="header module"]')[0]).find('a')[0]);

    out['url'] = header_div.attr('href');
    out['ao3id'] = out['url'].slice(7);
    out['title'] = header_div.html();

    out['title'] = $(raw_html).find('a').html();
    out['author'] = $(raw_html).find('a[rel=author]').html();
    var raw = $(raw_html).find('p[class=datetime]').html();
    out['updated'] = new Date(Date.parse(raw)).toJSON();

    var stats = $(raw_html).find('dl[class=stats]').children();
    for (var i = 0; i< stats.length; i+=2){
        // going by 2's through stats
        var key = $(stats[i]).html();
        var value = $(stats[i+1]).html();
        if (key == 'Words:'){
            out['wordcount'] = parseFloat(value.replace(',' ,''));
        }
    }

    out['chapters'] = parseChapters(raw_html);
    // Assume we've not read anything if adding from
    // browse tags page.
    out['chapters_read'] = 0;

    return out;
}

function parseTags(raw_html){
/* Parse out tags from either the "browse tags" or "bookmarks" page
    Tags are text nodes within a class "warnings"
*/  var tags = [];
    var tagLocations = $(raw_html).find('a[class="tag"]');
    for (var i = 0; i < tagLocations.length; i++){
        if (tagLocations.hasOwnProperty(i)) {
            tags.push(tagLocations[i].innerHTML);
        }
    }
    return tags;
}

function matchTag(string1, string2){
    if (!string1 || !string2){
        return false;
    }
    if (string1.toLowerCase().indexOf(string2.toLowerCase()) != -1){
        return true;
    }
    return false;
}

function checkTags(taglist, blacklist_tags){
    for (var i in taglist){
        for (var j in blacklist_tags){
            if (matchTag(taglist[i], blacklist_tags[j])){
                return true;
            }
        }
    }
    return false;
}

function checkIfBookmarksPage(){
    return ($('#main').attr('class').indexOf("bookmarks-index") != -1);
}

function checkIfTagsPage(){
    return ($('#main').attr('class').indexOf("works-index") != -1);
}


function checkIfArticlePage(){
    // Article pages are "works-show" or chapters-show?,
    //  while browse are "works-index"
    return ((!checkIfBookmarksPage()) && (!checkIfTagsPage()));
}


// Go through the page, look for all the <li class="work blurb group" id="work_2707844" role="article">
// Processing when running on the "browse tags" or "browse bookmarks"
function processBrowsePage(){
    var idsOnPage = [];
    var articles = $("li[role=article]");
    for (var i=0; i< articles.length; i++){
        var info = parseWorkBlurb(articles[i]);

        // Keep track of all the id's on the page
        idsOnPage.push(info['ao3id']);

        var toolbar = createToolbar(info, false);
        articles[i].appendChild(toolbar);

    }
    // Note that having a global "prefs" is FF only. TODO: fix
    if (prefs)
        blacklistBrowsePage(prefs);
    return idsOnPage;
}

function blacklistBrowsePage(prefs){
    var articles = $("li[role=article]");
    var blacklist_tags = prefs['tags'];

    if (typeof blacklist_tags === 'string'){
        blacklist_tags = blacklist_tags.split(',');
    }

    for (var i=0; i< articles.length; i++){
        var info = parseWorkBlurb(articles[i]);
        var tags = parseTags(articles[i]);

        // if it's a banned tag, hide it!
        if (checkTags(tags, blacklist_tags)){
            hideByTag(articles[i], info);
        }
    }
}


function processArticlePage(){

        // Processing when running on only a single article
        // Just append the tool bar!
        var info = parseArticlePage($('#main'));
        var toolbar = createToolbar(info, true);
        $('ul[class="work navigation actions"]').append(toolbar);

        // it's only one id
        return [info['ao3id']];
}


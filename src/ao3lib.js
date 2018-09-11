/*  Common core functions used for accessing the ao3 site. Used by both the
    crawler and the toolbar scripts.
*/
var addonName = 'ao3rdr';

// Handle the message getting the image data on activation
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
            show($(clearMe[i]).closest('.ao3rdr-toolbar-outer'));
        }
    };

}

// TODO: reformat this ugly global.
var pageChapter = extractChapterIdFromPage();

function setImage(html, stored_data){
    level = parseInt(stored_data.rating);

    if (stored_data.deleted){
        return;
    }

    if (level > 0) {
        var ele = $(html).find("img[src*='star-"+level+"']");
        $(ele).attr('src', images['star-'+level+'-fill']);
        $(ele).attr('do-delete', 1); // This makes it so clicking it again triggers a delete
    } else if (level == -1) {
        var ele = $(html).find("img[src*='dislike.svg']");
        $(ele).attr('src', images['dislike-fill']);
        $(ele).attr('do-delete', 1); // This makes it so clicking it again triggers a delete
        hide(ele.closest('.ao3rdr-toolbar-outer'));
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


function parseAuthor(raw_html){
    var authors = $(raw_html).find('a[rel="author"]');
    var authorList = [];
    authors.each(function(){
        authorList.push($(this).text());
    });
    return authorList;
}

function parseFandom(raw_html){
    var fandoms = $(raw_html).find('.fandoms.heading, .fandom.tags').find('a[class="tag"]');
    var fandomList = [];
    fandoms.each(function(){
        fandomList.push($(this).text());
    });
    return fandomList;
}


function parseDate(raw_date){
    /* Ensure that regardless of format, we stick to assuming UTC. 
        THIS ONLY WORKS FOR DATE, IT ASSUMES NO TIME IS SPECIFIED.
    */
    var _date = new Date(raw_date);
    if (_date.getUTCHours() == 0) {
        return _date.toJSON();
    }
    var out = new Date(Date.UTC(_date.getFullYear(), _date.getMonth(), _date.getDate(), 0, 0, 0));
    return out.toJSON();
    
}

function parseWordCount(raw_html){
    var str = $($(raw_html).find('dd[class=words]')[0]).text();
    return parseInt(str);
}

function parseArticlePage(raw_html){
/* Extract Information from an article page
*/
    var out = {};
    // Title, Author are in preface group

    out['author'] = parseAuthor(raw_html).join(', ');
    if (out['author'].length == 0){
        out['author'] = 'Anonymous';
    }
    out['fandom'] = parseFandom(raw_html).join(', ');

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
        if (($(stats[i]).html() == 'Published:') || ($(stats[i]).html() == 'Updated:')) {
            // Only overwrite if null
            raw_date =  $(stats[i+1]).html() || raw_date;
        }
    }
    out['updated'] = parseDate(raw_date);

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

    out['word_count'] = parseWordCount(raw_html);
    out['summary'] = $($($(raw_html).find('div.summary')).find('.userstuff')).text().trim();


    return out;
}

// Extract Meta Information
// Parse the Work ID, title, and author from each work
function parseWorkBlurb(raw_html){
    var out = {};
    var header_div = $($($(raw_html).find('div[class="header module"]')[0]).find('a')[0]);

    out['url'] = header_div.attr('href');
    out['ao3id'] = out['url'].slice(7);

    out['title'] = $($(raw_html).find('[class=heading]')).find('a[href^="/works/"]').text();

    out['author'] = parseAuthor(raw_html).join(', ');
    if (out['author'].length == 0){
        out['author'] = 'Anonymous';
    }
    out['fandom'] = parseFandom(raw_html).join(', ');

    var raw = $(raw_html).find('p[class=datetime]').html();
    out['updated'] = parseDate(raw);

    out['chapters'] = parseChapters(raw_html);
    // Assume we've not read anything if adding from
    // browse tags page.
    out['chapters_read'] = 0;

    out['word_count'] = parseWordCount(raw_html);
    out['summary'] = $($(raw_html).find('blockquote.userstuff.summary')).text().trim();

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
    var matches = [];
    for (var i in taglist){
        for (var j in blacklist_tags){
            if (matchTag(taglist[i], blacklist_tags[j])){
                matches.push(taglist[i]);
            }
        }
    }
    if (matches.length > 0){
        return matches;
    }
    return [];
}

function checkAuthors(authorList, blacklist_tags){
    // Similar to "checkTags", but author must match in it's entirety.
    // Case insensitive.
    var matches = [];
    for (var i in authorList){
        for (var j in blacklist_tags){
            var auth = authorList[i];
            var tag = blacklist_tags[j];
            if ((auth == tag) || (auth.toLowerCase() == tag.toLowerCase()) ){
                matches.push(auth);
            }
        }
    }
    if (matches.length > 0){
        return matches;
    }
    return [];
}

function checkIfBookmarksPage(raw_html){
    return ($(raw_html).find('.bookmark.index.group').length > 0);
}

function checkIfTagsPage(raw_html){
    return ($(raw_html).find('.work.index.group').length > 0);
}


function checkIfArticlePage(raw_html){
    // Article pages are "works-show" or chapters-show?,
    //  while browse are "works-index"
    // work meta group
    return ($(raw_html).find('.work.meta.group').length > 0);
}


// Go through the page, look for all the <li class="work blurb group" id="work_2707844" role="article">
// Processing when running on the "browse tags" or "browse bookmarks"
function processBrowsePage(raw_html){
    var idsOnPage = [];
    var articles = $(raw_html).find("li[role=article]");
    for (var i=0; i< articles.length; i++){
        var info = parseWorkBlurb(articles[i]);

        // Keep track of all the id's on the page
        idsOnPage.push(info['ao3id']);

        var toolbar = createToolbar(info, false);
        articles[i].appendChild(toolbar);

    }
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
        var authors = parseAuthor(articles[i]);
        var fandoms = parseFandom(articles[i]);

        // if it's a banned tag, hide it!
        var matching_tags = checkTags(tags, blacklist_tags);
        var matching_authors = checkAuthors(authors, blacklist_tags);
        // Check authors also works for fandoms
        var matching_fandoms = checkAuthors(fandoms, blacklist_tags);

        if ( (matching_authors.length || matching_tags.length || matching_fandoms.length) && prefs.autofilter){
            hideByTag(articles[i], info, matching_tags.concat(matching_authors).concat(matching_fandoms));
        }
    }
}


function processArticlePage(raw_html){

        // Processing when running on only a single article
        // Just append the toolbar!
        var info = parseArticlePage(raw_html);
        var toolbar = createToolbar(info, true);
        $('ul[class="work navigation actions"]').append(toolbar);
        $('dl[class="work meta group"]').append(toolbar);

        // it's only one id
        return [info['ao3id']];
}

// The entry into all of the AO3 actions
function ao3onReady(){
    onPageviewUpdater();
    var ids = processPage($('html'));
    toolbar_onload(ids);
}

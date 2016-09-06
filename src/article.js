function Article(metadata, mutable_data) {
/* Article Object. As it gets stored in memory.
*/
    var currentTime = new Date().getTime() / 1000; // ms to seconds
    this.ao3id = metadata.ao3id;
    this.author = unescape(metadata.author);
    this.author__ts = currentTime;
    this.title = unescape(metadata.title);
    this.title__ts = currentTime;
    this.crawled = new Date().toJSON();
    this.crawled__ts = currentTime;
    this.updated = new Date(metadata.updated).toJSON();
    this.updated__ts = currentTime;
    this.chapters = metadata['chapters'];
    this.chapters__ts = currentTime;

    if (mutable_data) {
        this.rating = mutable_data['rating'];
        this.rating__ts = currentTime;
        this.read = mutable_data['chapters_read'] || 0;
        this.read__ts = currentTime;
        this.chapter_id = mutable_data['chapter_id'];
        this.chapter_id__ts = currentTime;
        this.visit = mutable_data['visit'];
        this.visit__ts = currentTime;
        this.deleted = mutable_data['deleted'] || false;
        this.deleted__ts = currentTime;
    }

}

function updateArticle(old_article, new_article){
    /* Update an existing article.
           WARNING! MODIFIES the old_article!
           used by function handleNewFic
    */
    // Do nothing if mismatched ids!!!
    if (old_article.ao3id != new_article.ao3id) {
        return old_article;
    }

    var currentTime = new Date().getTime() / 1000;

    if (new_article.deleted){
        // Make sure that the deleted state is in fact the newest
        if (old_article.deleted != new_article.deleted){
            if (old_article.deleted__ts < new_article.deleted__ts){
                old_article.deleted = new_article.deleted;
                old_article.deleted__ts = new_article.deleted__ts;
            }
        } else {
            // If they're both deleted, we don't care about updating it at all
            return old_article;
        }
    } else if (old_article.deleted && !new_article.deleted){
        var new_rating = (new_article.rating && (new_article.rating__ts > old_article.deleted__ts));
        // var new_chapters = (new_article.chapters && (new_article.chapters__ts > old_article.deleted__ts));
        if (new_rating){
            if (old_article.deleted__ts < new_article.deleted__ts){
                old_article.deleted = new_article.deleted;
                old_article.deleted__ts = currentTime;
            }
        } else {
            // If rating or bookmark page haven't changed, don't un-delete.
            return old_article;
        }
    }

    // There will always be a crawled timestamp
    old_article.crawled = new_article.crawled;
    old_article.crawled__ts = new_article.crawled__ts;

    if (new_article.rating){
        // The dislike button is a special case, because it's value 
        // becomes "0" when we want to undo it (eg, clicked -1 rating again)
        if ((old_article.rating == -1) && (new_article.rating == -1)){
            new_article.rating = 0;
        }
        old_article.rating = new_article.rating;
        old_article.rating__ts = new_article.rating__ts;
    }

    if (new_article.chapters){
        // If we found a new chapter, there was an update!
        if (new_article.chapters['published'] > old_article.chapters['published']){
            old_article.hasupdate = true;
            old_article.hasupdate__ts = currentTime;
        }
        old_article.chapters = new_article.chapters;
        old_article.chapters__ts = new_article.chapters__ts;
    }

    if (new_article.visit){
        old_article.visit = new_article.visit;
        old_article.visit__ts = new_article.visit__ts;
        // Clear the hasupdate flag when you've visited
        old_article.hasupdate = false;
        old_article.hasupdate__ts = currentTime;
    }

    if (new_article.updated && new_article.updated != "undefined") {
        if (new_article.updated > old_article.updated){
            old_article.updated = new_article.updated;
            old_article.updated__ts = new_article.updated__ts;
        }
    }

    if ((new_article.title) && (new_article.title != "undefined")){
        if (old_article.title != new_article.title){
            old_article.title = fixRestrictedHTML(new_article.title);
            old_article.title__ts = new_article.title__ts;
        }
    }

    if (new_article.author && (new_article.author != "undefined")){
        if (old_article.author != new_article.title){
            old_article.author = new_article.author;
            old_article.author__ts = new_article.author__ts;
        }
    }
    // Important! We need to always update these both together!
    if (new_article.read || !(old_article.read)) {
        old_article.read = new_article.read;
        old_article.read__ts = new_article.read__ts;
        old_article.chapter_id = new_article.chapter_id;
        old_article.chapter_id__ts = new_article.chapter_id__ts;
    }
    syncWork(old_article);
    return old_article;
}

// from
// http://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values
function arrayCompare(array1, array2){
    return JSON.stringify(array1.sort()) === JSON.stringify(array2.sort());
}

function fixRestrictedHTML(title){
    // HACK
    // Fix the problem with the currupted title from old parsing of "restricted"
    // pages, containing <img alt="(Restricted)" ...
    var problem_string = '<img alt="(Restricted)" ';
    if (title.indexOf(problem_string) != -1){
        title = title.split('>')[1];
    }
    // Also a bug around "&amp;" and escaping.
    var title = title.replace(/&amp;/g, '').replace(/&lt;/g, '').replace(/&gt/g, '');

    return title;
}
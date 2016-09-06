// STUBS
function syncWork(work) {
    console.log('syncWork');
    console.log(work);
}

// Test Article updating
QUnit.module( "Article Object" );
QUnit.test( "Update Article - no mutable data", function( assert ) {
    // updateArticle(old_article, new_article)
    // Expected to update old_article in place.
    var metadata_old = {
        "ao3id":"12345678910111213",
        "title":"Test Work 2 - Mature - Two Chapters",
        "author":"testUser2",
        "updated":"2016-08-28T00:00:00.000Z",
        "chapters":{"published":"1","total":"2","complete":false}
    };

    var metadata_new = {
        "ao3id":"12345678910111213",
        "title":"Test Work 2 - Mature - Two Chapters",
        "author":"testUser2",
        "updated":"2016-08-29T00:00:00.000Z",
        "chapters":{"published":"2","total":"2","complete":true}
    };

    var old_article = new Article(metadata_old);
    var new_article = new Article(metadata_new);
    updateArticle(old_article, new_article);
    assert.equal( old_article.title, metadata_new.title, "updateArticle - title" );
    assert.equal( old_article.updated, metadata_new.updated, "updateArticle - updated" );
    assert.deepEqual( old_article.chapters, metadata_new.chapters, "updateArticle - chapters" );
});


QUnit.test( "Update Article - with mutable data", function( assert ) {
    // updateArticle(old_article, new_article)
    // Expected to update old_article in place.
    var metadata_old = {
        "ao3id":"12345678910111213",
        "title":"Test Work 2 - Mature - Two Chapters",
        "author":"testUser2",
        "updated":"2016-08-28T00:00:00.000Z",
        "chapters":{"published":"1","total":"2","complete":false}
    };

    var metadata_new = {
        "ao3id":"12345678910111213",
        "title":"Test Work 2 - Mature - Two Chapters",
        "author":"testUser2",
        "updated":"2016-08-29T00:00:00.000Z",
        "chapters":{"published":"2","total":"2","complete":true}
    };

    var mutable_data_old = {
        'rating': 5,
        'visit': "2016-08-28T00:00:00.000Z"
    };

    var mutable_data_new = {
        'rating': -1,
        'visit': "2016-08-29T00:00:00.000Z"
    };

    var old_article = new Article(metadata_old, mutable_data_old);
    var new_article = new Article(metadata_new, mutable_data_new);
    updateArticle(old_article, new_article);
    assert.equal( old_article.title, metadata_new.title, "updateArticle - title" );
    assert.equal( old_article.updated, metadata_new.updated, "updateArticle - updated" );
    assert.deepEqual( old_article.chapters, metadata_new.chapters, "updateArticle - chapters" );
    assert.equal( old_article.rating, mutable_data_new.rating, "updateArticle - rating" );
    assert.equal( old_article.visit, mutable_data_new.visit, "updateArticle - visit" );
});

QUnit.test( "Update Article - mismatch ID (shouldn't update)", function( assert ) {
    // updateArticle(old_article, new_article)
    // Expected to update old_article in place.
    var metadata_old = {
        "ao3id":"77777777777777",
        "title":"Test Work 1 - One Chapters",
        "author":"testUser",
        "updated":"2016-08-28T00:00:00.000Z",
        "chapters":{"published":"1","total":"1","complete":true}
    };

    var metadata_new = {
        "ao3id":"12345678910111213",
        "title":"Test Work 2 - Ten Chapters",
        "author":"testUser2",
        "updated":"2016-08-29T00:00:00.000Z",
        "chapters":{"published":"5","total":"10","complete":false}
    };

    var old_article = new Article(metadata_old);
    var new_article = new Article(metadata_new);
    updateArticle(old_article, new_article);
    assert.notEqual( old_article.title, metadata_new.title, "updateArticle - title" );
    assert.notEqual( old_article.updated, metadata_new.updated, "updateArticle - updated" );
    assert.notEqual( old_article.chapters, metadata_new.chapters, "updateArticle - chapters" );
});
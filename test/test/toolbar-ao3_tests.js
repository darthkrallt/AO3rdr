// Test toolbar stuff

// TOOLBAR STUBS
function emitSettingsClick () {
    console.log('settingsclick');
};

// UGh, the "images" as global really has to go :|
var images = {
    'star-0':'data/images/star-0.svg',
    'star-1':'data/images/star-1.svg',
    'star-3':'data/images/star-3.svg',
    'star-5':'data/images/star-5.svg',
    'star-1-fill':'data/images/star-1-fill.svg',
    'star-3-fill':'data/images/star-3-fill.svg',
    'star-5-fill':'data/images/star-5-fill.svg',
    'hidden':'data/images/hidden.svg',
    'dislike':'data/images/dislike.svg',
    'dislike-fill':'data/images/dislike-fill.svg',
    'delete':'data/images/delete.svg',
    'delete-fill':'data/images/delete-fill.svg',
    'menu':'data/images/menu.svg',
    'flag':'data/images/flag.svg',
    'unread':'data/images/unread.svg',
    'read':'data/images/read.svg',
    'bookmark':'data/images/bookmark.svg',
    'bookmark-fill':'data/images/bookmark-fill.svg',
};

// END TOOLBAR STUBS

QUnit.module( "Toolbar Content" );
// processPage returns ids on the page
QUnit.test( "processPage - bookmarks", function( assert ) {
    var fixture =  $( "#qunit-fixture-bookmarkspage-page" );
    var standardObject = [
      "888888888888",
      "5555555555"
     ];

    var checkMe = processPage(fixture);
    assert.deepEqual( checkMe, standardObject, "processPage" );
});

QUnit.test( "processPage - tags", function( assert ) {
    var fixture =  $( "#qunit-fixture-tagspage-page" );
    var standardObject = [
        "777777777777",
        "888888888888",
        "99999999999999"
    ];

    var checkMe = processPage(fixture);
    assert.deepEqual( checkMe, standardObject, "processPage" );
});

QUnit.test( "processPage - article", function( assert ) {
    var fixture =  $( "#qunit-fixture-workspage-mature-logout-one-chapter-confirmed-warning" );
    var standardObject = ["12345678910111213"];

    var checkMe = processPage(fixture);
    assert.deepEqual( checkMe, standardObject, "processPage" );
});

// Next all these likely need a refactor
// checkForBlacklistedArticle

// undoBlacklist

// createToolbar // Run though the click actions?
// Also covers updateImage ?

// hideByTag


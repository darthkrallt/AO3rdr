// Can we figure out what page it is?
QUnit.module( "Page Detection" );
QUnit.test( "Bookmarks Page", function( assert ) {
  var fixture = $( "#qunit-fixture-bookmarkspage-page" );
  assert.equal( true, checkIfBookmarksPage(fixture), "checkIfBookmarksPage" );
  assert.equal( false, checkIfTagsPage(fixture), "checkIfTagsPage" );
  assert.equal( false, checkIfArticlePage(fixture), "checkIfArticlePage" );
});

QUnit.test( "Tags Page", function( assert ) {
  var fixture = $( "#qunit-fixture-tagspage-page" );
  assert.equal( false, checkIfBookmarksPage(fixture), "checkIfBookmarksPage" );
  assert.equal( true, checkIfTagsPage(fixture), "checkIfTagsPage" );
  console.log(checkIfArticlePage(fixture));
  assert.equal( false, checkIfArticlePage(fixture), "checkIfArticlePage" );
});

QUnit.test( "Articles Page", function( assert ) {
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter-confirmed-warning" );
  assert.equal( false, checkIfBookmarksPage(fixture), "checkIfBookmarksPage" );
  assert.equal( false, checkIfTagsPage(fixture), "checkIfTagsPage" );
  assert.equal( true, checkIfArticlePage(fixture), "checkIfArticlePage" );
})

// Can we find the things on the page?
QUnit.module( "Page Parsing" );
QUnit.test( "Parse General one chapter work", function( assert ) {
  var fixture =  $( "#qunit-fixture-workspage-general-one-chapter" );
  var standardObject = {"url":"/works/123456789101112","ao3id":"123456789101112","title":"Test work - General - One Chapter","author":"testUser","updated":"2016-08-28T00:00:00.000Z","chapters":{"published":"1","total":"1","complete":true},"chapters_read":0};

  var checkMe = parseWorkBlurb(fixture);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

  var standardTags = ["The Avengers (Marvel Movies)", "No Archive Warnings Apply", "testA/testB", "testA", "testB", "Writing Tests", "Programmer doesn't know what a bed is"];
  var checkMe = parseTags(fixture);
  assert.deepEqual( checkMe, standardTags, "parseTags" );
});

QUnit.test( "Parse Mature Warning Page one chapter work logged out", function( assert ) {
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter" );
  var standardObject = {"url":"/works/12345678910111213","ao3id":"12345678910111213","title":"Test Work 2 - Mature - One Chapter","author":"testUser2","updated":"2016-08-28T00:00:00.000Z","chapters":{"published":"1","total":"1","complete":true},"chapters_read":0};
  var checkMe = parseWorkBlurb(fixture);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

  var standardTags = ["Star Trek: Alternate Original Series (Movies)", "No Archive Warnings Apply", 'Person A. Person/Human "Human" Human', "Person A. Person", 'Human "Human" Human', "post star trek beyond", "Writing Tests"];
  var checkMe = parseTags(fixture);
  assert.deepEqual( checkMe, standardTags, "parseTags" );
});

QUnit.test( "Parse Mature Warning Page one chapter work logged out warning confirmed", function( assert ) {
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter-confirmed-warning" );
  var standardObject = {"ao3id":"12345678910111213","title":"Test Work 2 - Mature - One Chapter","author":"testUser2","updated":"2016-08-28T00:00:00.000Z","chapters":{"published":"1","total":"1","complete":true},"chapters_read":1};
  var checkMe = parseArticlePage(fixture);
  assert.deepEqual( checkMe, standardObject, "parseWorksPage" );
});
 
// Can we process the page?
QUnit.module( "Page Processing" );
QUnit.test( "Get the list of ids from browse (tags) page", function( assert ) {
  // processBrowsePage
  // Ensure that this returns a list of ids
  var fixture = $( "#qunit-fixture-tagspage-page" );
  var standardObject =  [
    "777777777777",
    "888888888888",
    "99999999999999"
  ];
  createToolbar = function(){return document.createElement("p");}; // TODO: refactor this
  var checkMe = processBrowsePage(fixture);
  assert.deepEqual( checkMe, standardObject, "processBrowsePage" );
});

QUnit.test( "Get the list of ids from browse (tags) page", function( assert ) {
  // processArticlePage
  // Ensure that this returns one ids
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter-confirmed-warning" );
  var standardObject =  ["12345678910111213",];
  createToolbar = function(){return document.createElement("p");}; // TODO: refactor this
  var checkMe = processArticlePage(fixture);
  assert.deepEqual( checkMe, standardObject, "processArticlePage" );
});

// Blacklisting Tests
QUnit.module("Blacklisting Tests");
// Do blacklist only on complete author name, not partial
QUnit.test( "checkAuthors & checkTags Mature logged out", function( assert ) {
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter" );
  var blackList = ['testUser2', 'A. Person', 'test'];
  var standardObject = ['testUser2']; // The desired blacklisted author

  // Gotta parse Authors first
  var authors = parseAuthor(fixture);
  var checkMe = checkAuthors(authors, blackList);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

  // Gotta parse Tags first
  var tags = parseTags(fixture);
  var standardTags =  ['Person A. Person/Human \"Human\" Human', "Person A. Person", "Writing Tests"];
  var checkMe = checkTags(tags, blackList);
  assert.deepEqual( checkMe, standardTags, "parseTags" );
});

QUnit.test( "checkAuthors Mature logged out", function( assert ) {
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter" );
  var blackList = ['testUser', 'A. Person', 'test'];
  var standardObject = false; // The desired blacklisted author should be EMPTY

  // Gotta parse Authors first
  var authors = parseAuthor(fixture);
  var checkMe = checkAuthors(authors, blackList);
  console.log(authors);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

});

// Do blacklist only on complete author name, not partial
QUnit.test( "checkAuthors & checkTags tagspage", function( assert ) {
  var fixture = $( "#qunit-fixture-tagspage-page" );
  var first_work = fixture.find('#work_777777777777');
  var blackList = ['testUser6', 'test'];
  var standardObject = ['testUser6']; // The desired blacklisted author

  // Gotta parse Authors first
  var authors = parseAuthor(first_work);
  var checkMe = checkAuthors(authors, blackList);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

  // Gotta parse Tags first
  var tags = parseTags(first_work);
  var standardTags =  ["Writing Tests"];
  var checkMe = checkTags(tags, blackList);
  assert.deepEqual( checkMe, standardTags, "parseTags" );
});

QUnit.test( "checkAuthors tagspage", function( assert ) {
  var fixture = $( "#qunit-fixture-tagspage-page" );
  var first_work = fixture.find('#work_777777777777');
  var blackList = ['testUser', 'test'];
  var standardObject = false; // The desired blacklisted author should be EMPTY

  // Gotta parse Authors first
  var authors = parseAuthor(first_work);
  var checkMe = checkAuthors(authors, blackList);
  console.log(authors);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

});

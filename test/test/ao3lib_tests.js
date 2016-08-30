QUnit.module( "Parsing" );
QUnit.test( "Parse General one chapter work", function( assert ) {
  var fixture =  $( "#qunit-fixture-workspage-general-one-chapter" );
  var standardObject = {"url":"/works/123456789101112","ao3id":"123456789101112","title":"Test work - General - One Chapter","author":"testUser","updated":"2016-08-28T00:00:00.000Z","chapters":{"published":"1","total":"1","complete":true},"chapters_read":0};

  var checkMe = parseWorkBlurb(fixture);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

  var standardTags = ["The Avengers (Marvel Movies)", "No Archive Warnings Apply", "testA/testB", "testA", "testB", "Writing Tests", "Programmer doesn't know what a bed is"];
  var checkTags = parseTags(fixture);
  assert.deepEqual( checkTags, standardTags, "parseTags" );

});

QUnit.test( "Parse Mature Warning Page one chapter work logged out", function( assert ) {
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter" );
  var standardObject = {"url":"/works/12345678910111213","ao3id":"12345678910111213","title":"Test Work 2 - Mature - One Chapter","author":"testUser2","updated":"2016-08-28T00:00:00.000Z","chapters":{"published":"1","total":"1","complete":true},"chapters_read":0};
  var checkMe = parseWorkBlurb(fixture);
  assert.deepEqual( checkMe, standardObject, "parseWorkBlurb" );

  var standardTags = ["Star Trek: Alternate Original Series (Movies)", "No Archive Warnings Apply", 'Person A. Person/Human "Human" Human', "Person A. Person", 'Human "Human" Human', "post star trek beyond", "Writing Tests"];
  var checkTags = parseTags(fixture);
  assert.deepEqual( checkTags, standardTags, "parseTags" );

});

QUnit.test( "Parse Mature Warning Page one chapter work logged out warning confirmed", function( assert ) {
  var fixture = $( "#qunit-fixture-workspage-mature-logout-one-chapter-confirmed-warning" );
  var standardObject = {"ao3id":"12345678910111213","title":"Test Work 2 - Mature - One Chapter","author":"testUser2","updated":"2016-08-28T00:00:00.000Z","chapters":{"published":"1","total":"1","complete":true},"chapters_read":1};
  var checkMe = parseArticlePage(fixture);
  assert.deepEqual( checkMe, standardObject, "parseWorksPage" );

});
 
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

// processBrowsePage
// Ensure that this returns a list of ids

// parseTags
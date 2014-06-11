
(function( $, window ) {
  var $doc, $instance, instance, commonSetup, commonTeardown;

  $doc = $( document );

  commonSetup = function() {
    $instance = $( "[data-tau]" );
    instance = new window.componentNamespace.Tau( $instance[0] );
  };

  // TODO as needed
  commonTeardown = function() {};

  module( "constructor", config = {
    setup: commonSetup,
    teardown: commonTeardown
  });

  asyncTest( "starts auto-rotate", function() {
    var oldIndex = instance.index;

    setTimeout(function() {
      equal(oldIndex + 1, instance.index);
      start();
    }, window.componentNamespace.Tau.autoRotateDelay + 20);
  });

  test( "satisfies frame count", function() {
    var frames = parseInt( $instance.find("[data-frames]").attr("data-frames"), 10 );
    equal( $instance.find( "img" ).length, frames );
  });

  test( "sets current", function() {
    ok( instance.$current[0]);
  });

  test( "focuses the start image", function() {
    var start = parseInt( instance.$images.first().attr( "data-start" ) || "0" );
    ok( instance.$images.eq(start).attr( "class" ).indexOf("focus") >= -1 );
  });

  module( "change", config = {
    setup: commonSetup,
    teardown: commonTeardown
  });

  test( "advances the index by the delta", function() {
    instance.stopAutoRotate();

    var index = instance.index;
    instance.change( 2 );
    instance.change( -1 );

    equal( index + 2 - 1, instance.index );
  });
})( jQuery, this );

(function( $, window ) {
  var $doc, $instance, instance, commonSetup, commonTeardown;

  $doc = $( document );

  commonSetup = function() {
    $instance = $( "[data-tau]" );
    instance = new window.componentNamespace.Tau( $instance[0] );
  };

  commonTeardown = function() {
  };

  module( "constructor", config = {
    setup: commonSetup,
    teardown: commonTeardown
  });

  test( "creates images", function() {
    var frames = parseInt( $instance.find("[data-frames]").attr("data-frames"), 10 );
    equal( $instance.find( "img" ).length, frames );
  });

  test( "sets current", function() {
    equal( instance.$current[0], $instance.find( "img" )[0] );
  });

  module( "change", config = {
    setup: commonSetup,
    teardown: commonTeardown
  });

  module( "createImages", config = {
    setup: commonSetup,
    teardown: commonTeardown
  });

})( jQuery, this );

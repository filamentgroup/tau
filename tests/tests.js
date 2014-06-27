(function( $, window ) {
  var $doc, $instance, instance, commonSetup, commonTeardown, config;

  $doc = $( document );

  commonSetup = function() {
    $instance = $( "[data-tau]" );
    instance = new window.componentNamespace.Tau( $instance[0] );

    // force the goto to pass the loaded image check
    instance.$images.each(function() {
      this.tauImageLoaded = true;
    });
  };

  // TODO as needed
  commonTeardown = function() {};

  module( "constructor", {
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

  test( "focuses the first image", function() {
    ok( instance.$images.eq( 0 ).attr( "class" ).indexOf( "focus" ) > -1 );
  });

  module( "change", config = {
    setup: function() {
      commonSetup();
      instance.stopAutoRotate();
    },
    teardown: commonTeardown
  });

  test( "advances the index by the delta", function() {
    instance.stopAutoRotate();

    var index = instance.index;
    instance.change( 2 );
    instance.change( -1 );

    equal( index + 2 - 1, instance.index );
  });

  module( "goto", config );

  test( "changes focused class", function() {
    var oldFocused = instance.$element.find( ".focused" );

    instance.goto( instance.index + 1 );
    ok( oldFocused.attr("class").indexOf("focused") === -1 );
    ok( instance.$current.attr("class").indexOf("focused") > -1 );
  });

  test( "wraps negative indices", function() {
    instance.goto( 0 );
    instance.change( -1 );
    equal( instance.index, instance.$images.length - 1 );
  });

  test( "wraps positive indices ", function() {
    instance.goto( instance.$images.length - 1 );
    instance.change( 1 );
    equal( instance.index, 0 );
  });

  var path;

  module( "path", {
    setup: function() {
      path = new window.componentNamespace.Tau.Path();
    }
  });

  test( "is only sufficient for calculations with two points", function() {
    ok( !path.isSufficient(), "initially not sufficient" );

    path.record( {} );
    ok( !path.isSufficient(), "not sufficient after one record" );

    path.record( {} );
    ok( path.isSufficient(), "sufficient after two records" );
  });

  test( "distance is x, from second point to the first", function() {
    path.record({ x: 5 });
    path.record({ x: 0 });

    equal( path.distance(), -5 );
  });

  asyncTest( "duration is from the second time to the first time", function() {
    path.record({});

    setTimeout(function() {
      path.record({});

      ok( path.duration() >= 100 );
      start();
    }, 100);
  });

  asyncTest( "velocity takes a time step", function() {
    path.record({ x: 0 });

    setTimeout(function() {
      path.record({ x: 20 });

      equal( Math.ceil(path.velocity( 20 )), 4 );
      start();
    }, 100);
  });

  test( "resets to inssufficient", function() {
    path.record( {} );
    path.record( {} );
    ok( path.isSufficient(), "sufficient after two records" );

    path.reset();
    ok( !path.isSufficient(), "not sufficient after one record" );
  });
})( jQuery, this );

(function( $, window ) {
  var Tau, $doc, $instance, instance, commonSetup, commonTeardown, config;

  $doc = $( document );

  Tau = window.FG.Tau;

  commonSetup = function() {
    // force default behavior
    window.requestAnimationFrame = true;

    $instance = $( "[data-tau='template-frames']" );
    instance = new Tau( $instance[0], { canvas: false } );

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
      ok(oldIndex <= instance.index);
      start();
    }, instance.autoRotateDelay() + instance.autoRotateStartDelay + 200);
  });

  test( "satisfies frame count", function() {
    var frames = parseInt( $instance.find("[data-frames]").attr("data-frames"), 10 );
    equal( $instance.children().filter( "img" ).length, frames );
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

  module( "slow", {
    setup: function() {
      commonSetup();

      instance.path.record({
        x: 0
      });

      instance.path.record({
        x: 100
      });
    }
  });

  test( "returns early when the path isn't sufficient", function() {
    expect( 1 );

    instance.path.reset();
    ok( !instance.path.isSufficient() );

    instance.rotate = function() {
      ok( false );
    };

    instance.slow();
  });

  test( "calls rotate with updated coord", function() {
    expect( 1 );

    instance.velocity = 10;

    // called with the right value
    instance.rotate = function( point ) {
      equal( point.x, 110 );
    };

    instance.slow();
  });

  test( "reduces velocity", function() {
    var oldVelocity = instance.velocity = 10;

    instance.slow();

    // the velocity should be reduced
    equal( instance.velocity, oldVelocity - instance.decelVal() );
  });

  test( "clears the slow interval when velocity <= 0", function() {
    instance.velocity = instance.decelVal();
    instance.slow();
    ok( !instance.slowInterval );
    equal( instance.velocity, 0 );

    instance.velocity = instance.decelVal() - 1;
    instance.slow();
    ok( !instance.slowInterval );
    equal( instance.velocity, 0 );
  });

  test( "clears the slow interval when velocity >= 0", function() {
    instance.velocity = -1 * instance.decelVal();
    instance.slow();
    ok( !instance.slowInterval );
    equal( instance.velocity, 0 );

    instance.velocity = -1 * instance.decelVal() + 1;
    instance.slow();
    ok( !instance.slowInterval );
    equal( instance.velocity, 0 );
  });

  module( "decel", {
    setup: function() {
      commonSetup();
      instance.slow = function() {};
    }
  });

  test( "returns early for insufficient paths", function() {
    expect( 0 );

    instance.path.isSufficient = function() { return false; };

    instance.path.velocity = function() {
      ok( false, "path velocity should not be called" );
    };

    instance.decel();
  });

  test( "keeps a lid on positive velocity", function() {
    instance.path.isSufficient = function() { return true; };

    instance.path.velocity = function() {
      return 100;
    };

    instance.decel();

    equal(instance.velocity, Tau.maxVelocity);
  });

  test( "keeps a lid on negative velocity", function() {
    instance.path.isSufficient = function() { return true; };

    instance.path.velocity = function() {
      return -100;
    };

    instance.decel();

    equal(instance.velocity, -1 * Tau.maxVelocity);
  });

  var path;

  module( "path", {
    setup: function() {
      path = new Tau.Path();
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

  var $noTmplInst, noTmplInst;

  module("createImages", {
    setup: function(){
      commonSetup();

      $noTmplInst = $( "[data-tau='no-template-frames']" );
      noTmplInst = new Tau( $noTmplInst[0] );

      $noImgs = $( "[data-tau='no-frames']" );
    }
  });

  test( "doesn't add any images when the DOM has more than one already", function(){
    equal(noTmplInst.$images.length, 2);
    ok(instance.$images.length > 3);
  });

  test( "throws exception when there are no images", function(){
    throws(function(){
      new Tau( $noImgs[0] );
    });
  });

})( jQuery, this );

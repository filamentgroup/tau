
(function( window, $ ) {
  var $window, $doc;

  $window = $(window);
  $doc = $( document.documentElement );

  window.componentNamespace = window.componentNamespace || window;

  Function.prototype.bind = function( context ) {
    var self = this;

    return function() {
      self.apply( context, arguments );
    };
  };

  var Tau = window.componentNamespace.Tau = function( element ) {
    var startIndex;

    this.element = element;
    this.$element = $( element );
    this.$initial = this.$element.find("img");
    this.startIndex = parseInt( this.$initial.attr("data-start") || "0", 10 );

    this.createImages();

    // TODO all of this should probably wait until the images load
    this.goto( this.startIndex );
    this.autoRotate();
    this.bind();
  };

  Tau.autoRotateDelay = 64;
  Tau.verticalScrollRatio = 4;

  Tau.prototype.change = function( delta ) {
    this.goto( this.index + delta );
  };

  Tau.prototype.goto = function( index ) {
    var $next;

    // deal with negative indices properly
    if( index < 0 ) {
      index = this.$images.length + index;
    }

    // make sure we stay within the bounds of our image set, record the new value
    this.index = index % this.$images.length;

    $next = this.$images.eq( this.index );

    if( !$next[0].tauImageLoaded ) {
      return;
    }

    if( this.$current ) {
      this.$current.removeClass( "focused" );
    }

    // record the current focused image and make it visible
    this.$current = $next;
    this.$current.addClass( "focused" );
  };

  // TODO transplant the attributes from the initial image
  Tau.prototype.createImages = function() {
    var src, frames, $new;

    src = this.$initial.attr( "data-src-template" );
    frames = parseInt( this.$initial.attr( "data-frames" ), 10 );

    for( var i = 2; i <= frames; i++) {
      $new = $( "<img src=" + src.replace("$FRAME", i) + "></img>" );
      this.$element.append( $new );

      // record when each image has loaded
      $new.bind( "load", function() {
        this.tauImageLoaded = true;
      });
    }

    this.$images = this.$element.find( "img" );
  };

  Tau.prototype.bind = function() {
    $doc.bind( "mouseup touchend", this.release.bind(this) );
    this.$element.bind( "mousedown touchstart", this.track.bind(this) );
  };

  Tau.prototype.autoRotate = function() {
    this.autoInterval = setInterval(function() {
      this.change( 1 );
    }.bind(this), Tau.autoRotateDelay);
  };

  Tau.prototype.stopAutoRotate = function() {
    clearInterval( this.autoInterval );
  };

  Tau.prototype.track = function( event ) {
    var point;

    // prevent dragging behavior for mousedown
    if( event.type === "mousedown"  ){
      event.preventDefault();
    }

    if( this.tracking ) {
      return;
    }

    this.tracking = true;

    this.cursorGrab();

    // calculate/store how many pixels makes for an image switch
    this.rotateThreshold = $doc[0].clientWidth / this.$images.length;

    // record the x for threshold calculations
    point = this.getPoint( event );
    this.downX = point.x;
    this.downY = point.y;
    this.downIndex = this.index;

    $doc.bind( "mousemove", this.rotate.bind(this) );
    $doc.bind( "touchmove", this.rotate.bind(this) );
  };

  Tau.prototype.release = function( event ) {
    this.cursorRelease();
    $doc.unbind( "mousemove", this.rotate.bind(this) );
    $doc.unbind( "touchmove", this.rotate.bind(this) );
    this.tracking = false;
  };

  Tau.prototype.cursorGrab = function() {
    $doc.addClass( "grabbing" );
    this.$element.addClass( "grabbing" );
  };

  Tau.prototype.cursorRelease = function() {
    $doc.removeClass( "grabbing" );
    this.$element.removeClass( "grabbing" );
  };

  Tau.prototype.getPoint = function( event ) {
    var touch = event.touches || (event.originalEvent && event.originalEvent.touches);

    if( touch ){
      return {
        x: touch[0].pageX,
        y: touch[0].pageY
      };
    }

    return {
      x: event.pageX,
      y: event.pageY
    };
  };

  Tau.prototype.rotate = function( event ) {
    var deltaX, deltaY, point;

    point = this.getPoint( event );
    deltaX = point.x - this.downX;
    deltaY = point.y - this.downY;

    // if the movement on the Y dominates X then skip and allow scroll
    if( Math.abs(deltaY) / Math.abs(deltaX) >= Tau.verticalScrollRatio ) {
      return;
    }

    // NOTE works better on mousedown, here allows autorotate to continue on scroll
    this.stopAutoRotate();

    // NOTE to reverse the spin direction add the delta/thresh to the downIndex
    // NOTE it might be better to prevent anyway for slow drags across the image
    if( Math.abs(deltaX) >= this.rotateThreshold ) {
      event.preventDefault();
      this.goto( this.downIndex - Math.round(deltaX / this.rotateThreshold) );
    }
  };
})(this, jQuery);

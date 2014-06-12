(function( window, $ ) {
  var $window = $(window), $doc = $( document.documentElement );

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

    this.createImages();

    // TODO all of this should probably wait until the images load
    startIndex = parseInt( this.$images.first().attr("data-start") || "0", 10 );
    this.goto( startIndex );
    this.autoRotate();
    this.bind();
  };

  Tau.autoRotateDelay = 64;

  Tau.prototype.change = function( delta ) {
    this.goto( this.index + delta );
  };

  Tau.prototype.goto = function( index ) {
    if( this.$current ) {
      this.$current.removeClass( "focused" );
    }

    // deal with negative indices properly
    if( index < 0 ) {
      index = this.$images.length + index;
    }

    // make sure we stay within the bounds of our image set, record the new value
    this.index = index % this.$images.length;

    // record the current focused image and make it visible
    this.$current = this.$images.eq( this.index );
    this.$current.addClass( "focused" );
  };

  // TODO transplant the attributes from the initial image
  Tau.prototype.createImages = function() {
    var $initial, src, frames;

    $initial = this.$element.find( "img" );
    src = $initial.attr( "data-src-template" );
    frames = parseInt( $initial.attr( "data-frames" ), 10 );

    for( var i = 2; i <= frames; i++) {
      this.$element.append( "<img src=" + src.replace( "$FRAME", i ) + "></img>" );
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
    // prevent dragging behavior
    event.preventDefault();

    if( this.tracking ) {
      return;
    }

    this.tracking = true;

    this.stopAutoRotate();

    this.cursorGrab();

    // calculate/store how many pixels makes for an image switch
    this.threshold = $doc[0].clientWidth / this.$images.length;

    // record the x for threshold calculations
    this.downX = this.getX( event );
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

  Tau.prototype.getX = function( event ) {
    var touches = event.touches || (event.originalEvent && event.originalEvent.touches);

    if( touches ){
      return touches[0].pageX;
    }

    return event.pageX;
  };

  Tau.prototype.rotate = function( event ) {
    var delta = this.getX( event ) - this.downX;

    // NOTE to reverse the spin direction add the delta/thresh to the downIndex
    if( Math.abs(delta) >= this.threshold ) {
      this.goto( this.downIndex - Math.round(delta / this.threshold) );
    }
  };
})(this, jQuery);

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
    this.element = element;
    this.$element = $( element );

    this.createImages();
    this.goto( 0 );
    this.bind();
  };

  Tau.prototype.goto = function( index ) {
    if( this.$current ) {
      this.$current.removeClass( "focused" );
    }

    index = index % this.$images.length;

    if( index < 0 ) {
      index = this.$images.length + index;
    }

    this.$current = this.$images.eq( this.index = index % this.$images.length );
    this.$current.addClass( "focused" );
  };

  // TODO transplant the attributes from the initial image
  Tau.prototype.createImages = function() {
    var $initial, src, frames;

    $initial = this.$element.find( "img" );
    src = $initial.attr( "data-src-template" );
    frames = parseInt($initial.attr( "data-frames" ), 10);

    for( var i = 2; i <= frames; i++) {
      this.$element.append( "<img src=" + src.replace( "$COUNT", i ) + "></img>" );
    }

    this.$images = this.$element.find( "img" );
  };

  Tau.prototype.bind = function() {
    $doc.bind( "mouseup", this.release.bind(this) );
    this.$element.bind( "mousedown", this.track.bind(this) );
  };

  Tau.prototype.track = function( event ) {
    // prevent dragging behavior
    event.preventDefault();

    if( this.tracking ) {
      return;
    }

    this.tracking = true;

    // get the screen width once per drag
    this.clientWidth = $doc[0].clientWidth;

    // calculate/store how many pixels makes for an image switch
    this.threshold = this.clientWidth / this.$images.length;

    // record the x for threshold calculations
    this.downX = event.x;
    this.downIndex = this.index;

    $doc.bind( "mousemove", this.rotate.bind(this) );
  };

  Tau.prototype.release = function() {
    $doc.unbind( "mousemove", this.rotate.bind(this) );
    this.tracking = false;
  };

  Tau.prototype.rotate = function( event ) {
    var delta, x = event.x;

    // record the change as the rotation is happening
    delta = event.x - this.downX;

    if( Math.abs(delta) >= this.threshold ) {
      this.goto( this.downIndex + Math.round(delta / this.threshold) );
    }
  };
})(this, jQuery);

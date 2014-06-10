(function( window, $ ) {
  var $doc = $( document.documentElement );

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

  Tau.prototype.change = function( delta ) {
    this.goto( this.index = this.index + delta );
  };

  Tau.prototype.goto = function( index ) {
    this.$current = this.$images.eq( this.index = index );
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

    // TODO get the screen width once
    // TODO calculate/store how many pixels makes for an image switch
    // TODO record the x/y of the mousedown position
    $doc.bind( "mousemove", this.rotate.bind(this) );
  };

  Tau.prototype.release = function() {
    $doc.unbind( "mousemove", this.rotate.bind(this) );
    this.tracking = false;
  };

  Tau.prototype.rotate = function( event ) {
    var x = event.x, y = event.y;

    // TODO check the delta from the mousedown position
    // TODO decide how many frames left (negative) or right (positive)
    // TODO call change with the number of frames
  };
})(this, jQuery);

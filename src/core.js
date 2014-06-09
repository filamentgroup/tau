(function( window, $ ) {
  window.componentNamespace = window.componentNamespace || window;

  var Tau = window.componentNamespace.Tau = function( element ) {
    this.element = element;
    this.$element = $( element );

    this.createImages();
    this.goto( 0 );
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
})(this, jQuery);

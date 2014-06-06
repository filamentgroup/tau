(function( window, $ ) {
  window.componentNamespace = window.componentNamespace || window;

  var Tau = window.componentNamespace.Tau = function( element ) {
    this.element = element;
    this.$element = $( element );

    this.$images = this.$element.find( "img" );
    this.$current = this.$images.eq(0);
  };

  /* -1 || 1, calls goto */
  Tau.prototype.change = function() {};

  /* int to position */
  Tau.prototype.goto = function() {};
})(this, jQuery);

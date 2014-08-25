// TODO switch back to dom ready when shoestring is fixed
$( window ).bind( "load", function() {
  $( "[data-tau]" ).each(function( i ) {
    new window.componentNamespace.Tau( this );
  });
});

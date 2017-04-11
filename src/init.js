// TODO switch back to dom ready when shoestring is fixed
$( window ).bind( "load", function() {
  var ns = window.componentNamespace = window.componentNamespace || "FG";
  window[ns] = window[ns] || {};

  $( "[data-tau]" ).each(function( i ) {
    new window[ns].Tau( this );
  });
});
